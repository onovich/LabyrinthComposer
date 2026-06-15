import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph, type ValidationResult } from '@labyrinth/schema';

import { createGraphViewModel } from './graphSelectors.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'project-a',
    name: 'Project A'
  },
  startSpaceId: 'start',
  targetSpaceIds: ['end'],
  spaces: {
    start: {
      id: 'start',
      name: 'Start'
    },
    end: {
      id: 'end',
      name: 'End'
    }
  },
  connections: {
    'start-end': {
      id: 'start-end',
      fromSpaceId: 'start',
      toSpaceId: 'end'
    }
  },
  gates: {},
  tokens: {},
  puzzles: {},
  beats: {}
};

const validation: ValidationResult = {
  ok: false,
  reachableSpaces: ['start'],
  acquiredTokens: [],
  openedGates: [],
  solvedPuzzles: [],
  diagnostics: [],
  trace: []
};

describe('graph selectors', () => {
  it('marks reachable, unreachable, and highlighted graph entities', () => {
    const graph = createGraphViewModel(project, {
      validation,
      highlightedEntities: [
        { kind: 'space', id: 'end' },
        { kind: 'connection', id: 'start-end' }
      ]
    });

    expect(graph.nodes.map((node) => [node.id, node.validationState])).toEqual([
      ['end', 'affected'],
      ['start', 'reachable']
    ]);
    expect(graph.edges).toEqual([
      expect.objectContaining({
        id: 'start-end',
        validationState: 'affected'
      })
    ]);
  });
});
