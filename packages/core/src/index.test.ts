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
    expect(result.diagnostics).toEqual([
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
    ]);
    expect(result.diagnostics[0]?.suggestions.length).toBeGreaterThan(0);
  });
});
