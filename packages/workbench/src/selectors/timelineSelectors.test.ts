import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph, type ValidationResult } from '@labyrinth/schema';

import { createTimelineViewModel } from './timelineSelectors.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'timeline-selector',
    name: 'Timeline Selector'
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
  beats: {
    second: {
      id: 'second',
      name: 'Second',
      order: 2,
      intensity: 0.8,
      kind: 'threat'
    },
    first: {
      id: 'first',
      name: 'First',
      order: 1,
      intensity: 0.2,
      kind: 'discovery'
    }
  }
};

const validation: ValidationResult = {
  ok: true,
  reachableSpaces: ['start'],
  acquiredTokens: [],
  openedGates: [],
  solvedPuzzles: [],
  trace: [],
  diagnostics: [
    {
      id: 'timeline.intensity-spike:first',
      ruleId: 'timeline.intensity-spike',
      severity: 'warning',
      message: 'Spike',
      affectedEntities: [{ kind: 'beat', id: 'first' }],
      causeChain: [],
      suggestions: []
    }
  ]
};

describe('timeline selectors', () => {
  it('orders beats and attaches timeline diagnostic ids', () => {
    const viewModel = createTimelineViewModel(project, validation);

    expect(viewModel.beats.map((beat) => beat.id)).toEqual(['first', 'second']);
    expect(viewModel.minIntensity).toBe(0.2);
    expect(viewModel.maxIntensity).toBe(0.8);
    expect(viewModel.beats[0]?.diagnosticIds).toEqual(['timeline.intensity-spike:first']);
    expect(viewModel.diagnosticCount).toBe(1);
  });
});
