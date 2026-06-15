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
});
