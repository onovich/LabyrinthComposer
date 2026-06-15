import { describe, expect, it } from 'vitest';

import type { ProjectGraph, RulePreset, ValidationResult } from '@labyrinth/schema';
import { SCHEMA_VERSION } from '@labyrinth/schema';

import { createReportModel } from './reportModel.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'clinic',
    name: 'Clinic Wing'
  },
  rulePresetId: 'horror.clinic',
  startSpaceId: 'start',
  targetSpaceIds: ['exit'],
  spaces: {
    start: {
      id: 'start',
      name: 'Start'
    },
    exit: {
      id: 'exit',
      name: 'Exit'
    }
  },
  connections: {},
  gates: {},
  tokens: {},
  puzzles: {},
  beats: {
    clue: {
      id: 'clue',
      name: 'Find clue',
      kind: 'discovery',
      intensity: 0.4,
      order: 1,
      spaceId: 'start'
    }
  },
  diagnosticExceptions: [
    {
      id: 'exception-timeline',
      ruleId: 'timeline.intensity-flat',
      entityRefs: [{ kind: 'beat', id: 'clue' }]
    }
  ]
};

const validation: ValidationResult = {
  ok: false,
  reachableSpaces: ['start'],
  acquiredTokens: [],
  openedGates: [],
  solvedPuzzles: [],
  trace: [],
  diagnostics: [
    {
      id: 'timeline.intensity-flat.clue',
      ruleId: 'timeline.intensity-flat',
      severity: 'warning',
      message: 'Timeline intensity is flat.',
      affectedEntities: [{ kind: 'beat', id: 'clue' }],
      causeChain: [],
      suggestions: [],
      suppressed: true,
      exceptionId: 'exception-timeline'
    }
  ]
};

const rulePreset: RulePreset = {
  id: 'horror.clinic',
  name: 'Horror Clinic',
  enabledRuleIds: ['timeline.intensity-flat'],
  thresholds: {}
};

describe('createReportModel', () => {
  it('projects validation, exceptions, and timeline without recomputing diagnostics', () => {
    const model = createReportModel(project, validation, rulePreset, '2026-06-16T00:00:00.000Z');

    expect(model).toEqual(
      expect.objectContaining({
        generatedAt: '2026-06-16T00:00:00.000Z',
        project: {
          id: 'clinic',
          name: 'Clinic Wing'
        },
        rulePreset: {
          id: 'horror.clinic',
          name: 'Horror Clinic',
          description: undefined
        },
        summary: expect.objectContaining({
          ok: false,
          warnings: 1,
          suppressed: 1
        }),
        exceptions: project.diagnosticExceptions
      })
    );
    expect(model.timeline.beats).toEqual([
      expect.objectContaining({
        id: 'clue',
        diagnosticIds: ['timeline.intensity-flat.clue']
      })
    ]);
  });
});
