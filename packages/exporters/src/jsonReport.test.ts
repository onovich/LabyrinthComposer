import { describe, expect, it } from 'vitest';

import { formatJsonReport } from './jsonReport.js';
import type { LabyrinthReportModel } from './reportModel.js';

const model: LabyrinthReportModel = {
  generatedAt: '2026-06-16T00:00:00.000Z',
  schemaVersion: '0.1.0',
  project: {
    id: 'zelda',
    name: 'Zelda Mini Dungeon'
  },
  rulePreset: {
    id: 'zelda.mini-dungeon',
    name: 'Zelda Mini Dungeon'
  },
  summary: {
    ok: true,
    errors: 0,
    warnings: 0,
    info: 0,
    suppressed: 0,
    reachableSpaces: ['start'],
    acquiredTokens: ['key'],
    openedGates: [],
    solvedPuzzles: []
  },
  diagnostics: [],
  exceptions: [],
  timeline: {
    beats: [],
    minIntensity: 0,
    maxIntensity: 0,
    diagnosticCount: 0
  }
};

describe('formatJsonReport', () => {
  it('emits stable pretty JSON with a trailing newline', () => {
    const text = formatJsonReport(model);

    expect(text.endsWith('\n')).toBe(true);
    expect(JSON.parse(text) as unknown).toEqual(model);
  });
});
