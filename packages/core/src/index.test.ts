import { describe, expect, it } from 'vitest';

import { type ProjectGraph, SCHEMA_VERSION } from '@labyrinth/schema';

import { validateProject } from './index.js';

function baseProject(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'reference-test',
      name: 'Reference Test'
    },
    startSpaceId: 'entry',
    targetSpaceIds: ['exit'],
    spaces: {
      entry: {
        id: 'entry',
        name: 'Entry'
      },
      exit: {
        id: 'exit',
        name: 'Exit'
      }
    },
    connections: {
      'entry-exit': {
        id: 'entry-exit',
        fromSpaceId: 'entry',
        toSpaceId: 'exit'
      }
    },
    gates: {},
    tokens: {},
    puzzles: {},
    beats: {}
  };
}

describe('validateProject reference integrity', () => {
  it('passes a project whose entity references exist', () => {
    const result = validateProject(baseProject());

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.reachableSpaces).toEqual(['entry', 'exit']);
  });

  it('emits a structured diagnostic when an entity reference is missing', () => {
    const project = baseProject();
    const connection = project.connections['entry-exit'];

    if (connection === undefined) {
      throw new Error('Test fixture is missing entry-exit connection.');
    }

    project.connections['entry-exit'] = {
      ...connection,
      gateId: 'missing-gate'
    };

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'reference.missing-entity',
          severity: 'error',
          affectedEntities: [
            { kind: 'connection', id: 'entry-exit' },
            { kind: 'gate', id: 'missing-gate' }
          ],
          causeChain: [
            expect.objectContaining({
              entity: { kind: 'connection', id: 'entry-exit' }
            })
          ]
        })
      ])
    );
    expect(
      result.diagnostics.find((diagnostic) => diagnostic.ruleId === 'reference.missing-entity')
        ?.suggestions.length
    ).toBeGreaterThan(0);
  });
});

describe('validateProject reachability', () => {
  it('opens gates, solves puzzles, and reaches targets through fixed-point expansion', () => {
    const project: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'fixed-point',
        name: 'Fixed Point'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['exit'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        },
        key: {
          id: 'key',
          name: 'Key Room'
        },
        machine: {
          id: 'machine',
          name: 'Machine Room'
        },
        exit: {
          id: 'exit',
          name: 'Exit'
        }
      },
      connections: {
        'start-key': {
          id: 'start-key',
          fromSpaceId: 'start',
          toSpaceId: 'key'
        },
        'key-machine': {
          id: 'key-machine',
          fromSpaceId: 'key',
          toSpaceId: 'machine',
          gateId: 'key-gate'
        },
        'machine-exit': {
          id: 'machine-exit',
          fromSpaceId: 'machine',
          toSpaceId: 'exit',
          gateId: 'power-gate'
        }
      },
      gates: {
        'key-gate': {
          id: 'key-gate',
          name: 'Key Gate',
          kind: 'lock',
          requiredTokenIds: ['small-key']
        },
        'power-gate': {
          id: 'power-gate',
          name: 'Power Gate',
          kind: 'state',
          requiredTokenIds: ['power-on']
        }
      },
      tokens: {
        'small-key': {
          id: 'small-key',
          name: 'Small Key',
          kind: 'item',
          locationSpaceId: 'key'
        },
        'power-on': {
          id: 'power-on',
          name: 'Power On',
          kind: 'state'
        }
      },
      puzzles: {
        generator: {
          id: 'generator',
          name: 'Start Generator',
          locationSpaceId: 'machine',
          requiredTokenIds: ['small-key'],
          outputTokenIds: ['power-on']
        }
      },
      beats: {}
    };

    const result = validateProject(project);

    expect(result.ok).toBe(true);
    expect(result.reachableSpaces).toEqual(['exit', 'key', 'machine', 'start']);
    expect(result.acquiredTokens).toEqual(['power-on', 'small-key']);
    expect(result.openedGates).toEqual(['key-gate', 'power-gate']);
    expect(result.solvedPuzzles).toEqual(['generator']);
    expect(result.trace.length).toBeGreaterThan(1);
  });

  it('reports a missing start space', () => {
    const project = baseProject();
    project.startSpaceId = 'missing-start';

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'project.missing-start-space',
          affectedEntities: [{ kind: 'space', id: 'missing-start' }]
        })
      ])
    );
  });

  it('reports existing targets that cannot be reached', () => {
    const project = baseProject();
    project.connections = {};

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'reachability.target-unreachable',
          affectedEntities: [
            { kind: 'space', id: 'entry' },
            { kind: 'space', id: 'exit' }
          ]
        })
      ])
    );
  });
});

describe('validateProject core diagnostics', () => {
  it('reports a token locked behind the gate that requires it', () => {
    const project: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'own-gate',
        name: 'Own Gate'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['locked'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        },
        locked: {
          id: 'locked',
          name: 'Locked'
        }
      },
      connections: {
        'start-locked': {
          id: 'start-locked',
          fromSpaceId: 'start',
          toSpaceId: 'locked',
          gateId: 'key-gate'
        }
      },
      gates: {
        'key-gate': {
          id: 'key-gate',
          name: 'Key Gate',
          kind: 'lock',
          requiredTokenIds: ['key']
        }
      },
      tokens: {
        key: {
          id: 'key',
          name: 'Key',
          kind: 'item',
          locationSpaceId: 'locked'
        }
      },
      puzzles: {},
      beats: {}
    };

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'reachability.token-locked-behind-own-gate',
          affectedEntities: [
            { kind: 'gate', id: 'key-gate' },
            { kind: 'token', id: 'key' },
            { kind: 'space', id: 'locked' }
          ]
        })
      ])
    );
  });

  it('reports circular token requirements', () => {
    const project: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'self-cycle',
        name: 'Self Cycle'
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
      tokens: {
        clue: {
          id: 'clue',
          name: 'Clue',
          kind: 'knowledge'
        }
      },
      puzzles: {
        cluePuzzle: {
          id: 'cluePuzzle',
          name: 'Clue Puzzle',
          locationSpaceId: 'start',
          requiredTokenIds: ['clue'],
          outputTokenIds: ['clue']
        }
      },
      beats: {}
    };

    const result = validateProject(project);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'dependency.circular-token-requirement',
          severity: 'error'
        })
      ])
    );
  });

  it('reports reachable puzzles whose inputs are never acquired', () => {
    const project: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'missing-input',
        name: 'Missing Input'
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
      tokens: {
        fuse: {
          id: 'fuse',
          name: 'Fuse',
          kind: 'item'
        }
      },
      puzzles: {
        breaker: {
          id: 'breaker',
          name: 'Breaker',
          locationSpaceId: 'start',
          requiredTokenIds: ['fuse'],
          outputTokenIds: []
        }
      },
      beats: {}
    };

    const result = validateProject(project);

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'puzzle.missing-input',
          severity: 'warning',
          affectedEntities: [
            { kind: 'puzzle', id: 'breaker' },
            { kind: 'token', id: 'fuse' }
          ]
        })
      ])
    );
  });

  it('warns when token return distance is above the Phase 0 threshold', () => {
    const project: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'long-return',
        name: 'Long Return'
      },
      startSpaceId: 's0',
      targetSpaceIds: ['exit'],
      spaces: {
        s0: {
          id: 's0',
          name: 'S0'
        },
        s1: {
          id: 's1',
          name: 'S1'
        },
        s2: {
          id: 's2',
          name: 'S2'
        },
        s3: {
          id: 's3',
          name: 'S3'
        },
        s4: {
          id: 's4',
          name: 'S4'
        },
        s5: {
          id: 's5',
          name: 'S5'
        },
        exit: {
          id: 'exit',
          name: 'Exit'
        }
      },
      connections: {
        's0-s1': {
          id: 's0-s1',
          fromSpaceId: 's0',
          toSpaceId: 's1'
        },
        's1-s2': {
          id: 's1-s2',
          fromSpaceId: 's1',
          toSpaceId: 's2'
        },
        's2-s3': {
          id: 's2-s3',
          fromSpaceId: 's2',
          toSpaceId: 's3'
        },
        's3-s4': {
          id: 's3-s4',
          fromSpaceId: 's3',
          toSpaceId: 's4'
        },
        's4-s5': {
          id: 's4-s5',
          fromSpaceId: 's4',
          toSpaceId: 's5'
        },
        's5-exit': {
          id: 's5-exit',
          fromSpaceId: 's5',
          toSpaceId: 'exit',
          gateId: 'key-gate'
        }
      },
      gates: {
        'key-gate': {
          id: 'key-gate',
          name: 'Key Gate',
          kind: 'lock',
          requiredTokenIds: ['key']
        }
      },
      tokens: {
        key: {
          id: 'key',
          name: 'Key',
          kind: 'item',
          locationSpaceId: 's0'
        }
      },
      puzzles: {},
      beats: {}
    };

    const result = validateProject(project);

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'backtracking.long-token-return',
          severity: 'warning',
          affectedEntities: [
            { kind: 'token', id: 'key' },
            { kind: 'gate', id: 'key-gate' }
          ]
        })
      ])
    );
  });
});
