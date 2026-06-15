import { describe, expect, it } from 'vitest';

import { formatMarkdownReport } from './markdownReport.js';
import type { LabyrinthReportModel } from './reportModel.js';

const model: LabyrinthReportModel = {
  generatedAt: '2026-06-16T00:00:00.000Z',
  schemaVersion: '0.1.0',
  project: {
    id: 'clinic',
    name: 'Clinic Wing'
  },
  rulePreset: {
    id: 'horror.clinic',
    name: 'Horror Clinic'
  },
  summary: {
    ok: false,
    errors: 1,
    warnings: 0,
    info: 0,
    suppressed: 0,
    reachableSpaces: ['start'],
    acquiredTokens: [],
    openedGates: [],
    solvedPuzzles: []
  },
  diagnostics: [
    {
      id: 'target-unreachable',
      ruleId: 'reachability.target-unreachable',
      severity: 'error',
      message: 'Target space is unreachable.',
      affectedEntities: [{ kind: 'space', id: 'exit' }],
      causeChain: [],
      suggestions: [
        {
          kind: 'add_connection',
          message: 'Add a route to the exit.',
          targetEntities: [{ kind: 'space', id: 'exit' }]
        }
      ]
    }
  ],
  exceptions: [],
  timeline: {
    beats: [],
    minIntensity: 0,
    maxIntensity: 0,
    diagnosticCount: 0
  }
};

describe('formatMarkdownReport', () => {
  it('formats a review-ready report with summary, diagnostics, and fixes', () => {
    const markdown = formatMarkdownReport(model);

    expect(markdown).toContain('# Labyrinth Composer Report');
    expect(markdown).toContain('## Project');
    expect(markdown).toContain('- Name: Clinic Wing');
    expect(markdown).toContain('## Rule Preset');
    expect(markdown).toContain('- ID: horror.clinic');
    expect(markdown).toContain('## Errors');
    expect(markdown).toContain('reachability.target-unreachable');
    expect(markdown).toContain('## Suggested Fixes');
    expect(markdown).toContain('Add a route to the exit.');
  });
});
