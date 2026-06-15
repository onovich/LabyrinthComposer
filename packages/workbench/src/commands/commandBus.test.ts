import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import { applyCommand } from './commandHandlers.js';
import { createCommandBus } from './commandBus.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'command-test',
      name: 'Command Test'
    },
    startSpaceId: 'start',
    targetSpaceIds: ['start'],
    spaces: {
      start: {
        id: 'start',
        name: 'Start'
      }
    },
    connections: {},
    gates: {},
    tokens: {},
    puzzles: {},
    beats: {}
  };
}

describe('command bus', () => {
  it('applies commands without mutating the input project', () => {
    const project = projectFixture();
    const result = applyCommand(project, {
      type: 'CreateSpace',
      payload: {
        space: {
          id: 'exit',
          name: 'Exit'
        },
        addToTargets: true
      }
    });

    expect(project.spaces.exit).toBeUndefined();
    expect(project.targetSpaceIds).toEqual(['start']);
    expect(result.project.spaces.exit).toEqual({ id: 'exit', name: 'Exit' });
    expect(result.project.targetSpaceIds).toEqual(['exit', 'start']);
  });

  it('supports command replay with undo and redo', () => {
    const bus = createCommandBus(projectFixture());

    bus.dispatch({
      type: 'CreateSpace',
      payload: {
        space: {
          id: 'exit',
          name: 'Exit'
        }
      }
    });
    bus.dispatch({
      type: 'ConnectSpaces',
      payload: {
        connection: {
          id: 'start-exit',
          fromSpaceId: 'start',
          toSpaceId: 'exit'
        }
      }
    });

    expect(bus.getProject().connections['start-exit']).toBeDefined();
    expect(bus.canUndo()).toBe(true);
    expect(bus.canRedo()).toBe(false);

    bus.undo();
    expect(bus.getProject().connections['start-exit']).toBeUndefined();
    expect(bus.canRedo()).toBe(true);

    bus.redo();
    expect(bus.getProject().connections['start-exit']).toBeDefined();
  });

  it('rejects commands that would create dangling references', () => {
    const bus = createCommandBus(projectFixture());

    expect(() =>
      bus.dispatch({
        type: 'ConnectSpaces',
        payload: {
          connection: {
            id: 'missing-exit',
            fromSpaceId: 'start',
            toSpaceId: 'missing'
          }
        }
      })
    ).toThrow('Space "missing" does not exist.');
  });

  it('creates gates, tokens, puzzles, and beats through serializable commands', () => {
    const bus = createCommandBus(projectFixture());

    bus.dispatch({
      type: 'CreateToken',
      payload: {
        token: {
          id: 'key',
          name: 'Key',
          kind: 'item',
          locationSpaceId: 'start'
        }
      }
    });
    bus.dispatch({
      type: 'CreateGate',
      payload: {
        gate: {
          id: 'gate',
          name: 'Gate',
          kind: 'lock',
          requiredTokenIds: ['key']
        }
      }
    });
    bus.dispatch({
      type: 'CreatePuzzle',
      payload: {
        puzzle: {
          id: 'puzzle',
          name: 'Puzzle',
          locationSpaceId: 'start',
          requiredTokenIds: ['key'],
          outputTokenIds: ['key']
        }
      }
    });
    bus.dispatch({
      type: 'UpdateBeat',
      payload: {
        beat: {
          id: 'beat',
          name: 'Beat',
          spaceId: 'start'
        }
      }
    });

    expect(bus.getProject().tokens.key).toBeDefined();
    expect(bus.getProject().gates.gate).toBeDefined();
    expect(bus.getProject().puzzles.puzzle).toBeDefined();
    expect(bus.getProject().beats.beat).toBeDefined();
  });

  it('updates rule preset, overrides, exceptions, and beat order through undoable commands', () => {
    const bus = createCommandBus(projectFixture());

    bus.dispatch({
      type: 'UpdateBeat',
      payload: {
        beat: {
          id: 'beat',
          name: 'Beat',
          spaceId: 'start',
          order: 2
        }
      }
    });
    bus.dispatch({
      type: 'SetRulePreset',
      payload: {
        rulePresetId: 'horror.clinic'
      }
    });
    bus.dispatch({
      type: 'UpdateRuleOverride',
      payload: {
        override: {
          ruleId: 'timeline.intensity-flat',
          thresholdOverrides: {
            flatIntensityDelta: 0.05
          },
          severity: 'warning'
        }
      }
    });
    bus.dispatch({
      type: 'AddDiagnosticException',
      payload: {
        exception: {
          id: 'exception-1',
          ruleId: 'timeline.intensity-flat',
          entityRefs: [{ kind: 'beat', id: 'beat' }],
          reason: 'Flat pacing is intentional.'
        }
      }
    });
    bus.dispatch({
      type: 'ReorderBeat',
      payload: {
        id: 'beat',
        order: 1
      }
    });

    expect(bus.getProject()).toEqual(
      expect.objectContaining({
        rulePresetId: 'horror.clinic',
        ruleOverrides: [
          {
            ruleId: 'timeline.intensity-flat',
            thresholdOverrides: {
              flatIntensityDelta: 0.05
            },
            severity: 'warning'
          }
        ],
        diagnosticExceptions: [
          {
            id: 'exception-1',
            ruleId: 'timeline.intensity-flat',
            entityRefs: [{ kind: 'beat', id: 'beat' }],
            reason: 'Flat pacing is intentional.'
          }
        ]
      })
    );
    expect(bus.getProject().beats.beat?.order).toBe(1);

    bus.undo();
    expect(bus.getProject().beats.beat?.order).toBe(2);

    bus.redo();
    expect(bus.getProject().beats.beat?.order).toBe(1);
  });

  it('can remove rule overrides and diagnostic exceptions', () => {
    const project = applyCommand(
      applyCommand(projectFixture(), {
        type: 'UpdateRuleOverride',
        payload: {
          override: {
            ruleId: 'hint.token-use-too-late',
            disabled: true
          }
        }
      }).project,
      {
        type: 'AddDiagnosticException',
        payload: {
          exception: {
            id: 'exception-1',
            ruleId: 'hint.token-use-too-late',
            entityRefs: [{ kind: 'token', id: 'key' }]
          }
        }
      }
    ).project;

    const withoutOverride = applyCommand(project, {
      type: 'RemoveRuleOverride',
      payload: {
        ruleId: 'hint.token-use-too-late'
      }
    }).project;
    const withoutException = applyCommand(withoutOverride, {
      type: 'RemoveDiagnosticException',
      payload: {
        id: 'exception-1'
      }
    }).project;

    expect(withoutException.ruleOverrides).toBeUndefined();
    expect(withoutException.diagnosticExceptions).toBeUndefined();
  });

  it('updates inspector-owned fields through commands', () => {
    const bus = createCommandBus(projectFixture());

    bus.dispatch({
      type: 'CreateSpace',
      payload: {
        space: {
          id: 'exit',
          name: 'Exit'
        }
      }
    });
    bus.dispatch({
      type: 'CreateToken',
      payload: {
        token: {
          id: 'key',
          name: 'Key',
          kind: 'item',
          locationSpaceId: 'start'
        }
      }
    });
    bus.dispatch({
      type: 'CreateGate',
      payload: {
        gate: {
          id: 'gate',
          name: 'Gate',
          kind: 'lock',
          requiredTokenIds: ['key']
        }
      }
    });
    bus.dispatch({
      type: 'ConnectSpaces',
      payload: {
        connection: {
          id: 'start-exit',
          fromSpaceId: 'start',
          toSpaceId: 'exit'
        }
      }
    });
    bus.dispatch({
      type: 'CreatePuzzle',
      payload: {
        puzzle: {
          id: 'puzzle',
          name: 'Puzzle',
          locationSpaceId: 'exit',
          requiredTokenIds: ['key'],
          outputTokenIds: ['key']
        }
      }
    });
    bus.dispatch({
      type: 'UpdateSpace',
      payload: {
        id: 'start',
        patch: {
          description: 'Opening space',
          tags: ['intro']
        }
      }
    });
    bus.dispatch({
      type: 'UpdateConnection',
      payload: {
        id: 'start-exit',
        patch: {
          directed: true,
          gateId: 'gate',
          description: 'Locked route'
        }
      }
    });
    bus.dispatch({
      type: 'UpdateGate',
      payload: {
        id: 'gate',
        patch: {
          kind: 'knowledge',
          description: 'Needs a clue'
        }
      }
    });
    bus.dispatch({
      type: 'UpdateToken',
      payload: {
        id: 'key',
        patch: {
          kind: 'knowledge',
          locationSpaceId: 'exit',
          description: 'Clue text'
        }
      }
    });
    bus.dispatch({
      type: 'UpdatePuzzle',
      payload: {
        id: 'puzzle',
        patch: {
          locationSpaceId: 'start',
          description: 'Solve at start'
        }
      }
    });
    bus.dispatch({
      type: 'UpdateBeat',
      payload: {
        beat: {
          id: 'beat',
          name: 'Beat',
          spaceId: 'exit',
          intensity: 0.75,
          description: 'Tension spike'
        }
      }
    });

    const project = bus.getProject();

    expect(project.spaces.start?.description).toBe('Opening space');
    expect(project.connections['start-exit']).toEqual(
      expect.objectContaining({ directed: true, gateId: 'gate', description: 'Locked route' })
    );
    expect(project.gates.gate).toEqual(
      expect.objectContaining({ kind: 'knowledge', description: 'Needs a clue' })
    );
    expect(project.tokens.key).toEqual(
      expect.objectContaining({
        kind: 'knowledge',
        locationSpaceId: 'exit',
        description: 'Clue text'
      })
    );
    expect(project.puzzles.puzzle).toEqual(
      expect.objectContaining({ locationSpaceId: 'start', description: 'Solve at start' })
    );
    expect(project.beats.beat).toEqual(
      expect.objectContaining({ spaceId: 'exit', intensity: 0.75, description: 'Tension spike' })
    );
  });
});
