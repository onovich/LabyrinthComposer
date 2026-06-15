import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph, type ValidationResult } from '@labyrinth/schema';

import { createReportViewModel } from './reportSelectors.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'report-selector',
    name: 'Report Selector'
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
    beat: {
      id: 'beat',
      name: 'Beat',
      intensity: 0.5
    }
  },
  rulePresetId: 'horror.clinic',
  diagnosticExceptions: [
    {
      id: 'exception-1',
      ruleId: 'timeline.intensity-flat',
      entityRefs: [{ kind: 'beat', id: 'beat' }]
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
      id: 'error',
      ruleId: 'error.rule',
      severity: 'error',
      message: 'Error',
      affectedEntities: [],
      causeChain: [],
      suggestions: []
    },
    {
      id: 'warning',
      ruleId: 'warning.rule',
      severity: 'warning',
      message: 'Warning',
      affectedEntities: [],
      causeChain: [],
      suggestions: [],
      suppressed: true,
      exceptionId: 'exception-1'
    },
    {
      id: 'info',
      ruleId: 'info.rule',
      severity: 'info',
      message: 'Info',
      affectedEntities: [],
      causeChain: [],
      suggestions: []
    }
  ]
};

describe('report selectors', () => {
  it('projects report summary without regenerating diagnostics', () => {
    const viewModel = createReportViewModel(project, validation);

    expect(viewModel.projectName).toBe('Report Selector');
    expect(viewModel.rulePresetName).toBe('Horror Clinic');
    expect(viewModel.summary).toEqual({
      errors: 1,
      warnings: 1,
      info: 1,
      suppressed: 1
    });
    expect(viewModel.exceptionCount).toBe(1);
    expect(viewModel.timeline.beats.map((beat) => beat.id)).toEqual(['beat']);
  });
});
