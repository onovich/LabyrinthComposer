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
      toSpaceId: 'end',
      gateId: 'gate-a'
    }
  },
  gates: {
    'gate-a': {
      id: 'gate-a',
      name: 'Gate A',
      kind: 'lock',
      requiredTokenIds: ['key-a']
    }
  },
  tokens: {
    'key-a': {
      id: 'key-a',
      name: 'Key A',
      kind: 'item',
      locationSpaceId: 'start'
    },
    'reward-a': {
      id: 'reward-a',
      name: 'Reward A',
      kind: 'knowledge'
    }
  },
  puzzles: {
    'puzzle-a': {
      id: 'puzzle-a',
      name: 'Puzzle A',
      locationSpaceId: 'end',
      requiredTokenIds: ['key-a'],
      outputTokenIds: ['reward-a']
    }
  },
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
        { kind: 'gate', id: 'gate-a' },
        { kind: 'token', id: 'key-a' },
        { kind: 'puzzle', id: 'puzzle-a' }
      ]
    });

    expect(graph.nodes.map((node) => [node.id, node.validationState])).toEqual([
      ['end', 'affected'],
      ['start', 'reachable'],
      ['token:key-a', 'affected'],
      ['token:reward-a', 'neutral'],
      ['puzzle:puzzle-a', 'affected']
    ]);
    expect(graph.edges).toEqual([
      expect.objectContaining({
        id: 'start-end',
        gateId: 'gate-a',
        label: 'Gate A',
        validationState: 'affected'
      })
    ]);
  });
});
