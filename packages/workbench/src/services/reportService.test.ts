import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph, type ValidationResult } from '@labyrinth/schema';

import { createReportText } from './reportService.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'maze',
    name: 'Maze'
  },
  startSpaceId: 'start',
  targetSpaceIds: ['exit'],
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

const validation: ValidationResult = {
  ok: true,
  reachableSpaces: ['start'],
  acquiredTokens: [],
  openedGates: [],
  solvedPuzzles: [],
  trace: [],
  diagnostics: []
};

const snapshot = {
  project,
  validation,
  rulePreset: {
    id: 'maze.standard',
    name: 'Standard Maze',
    enabledRuleIds: [],
    thresholds: {}
  }
};

describe('createReportText', () => {
  it('formats markdown from a workbench snapshot', () => {
    const text = createReportText(snapshot, 'markdown', '2026-06-16T00:00:00.000Z');

    expect(text).toContain('# Labyrinth Composer Report');
    expect(text).toContain('- Name: Maze');
    expect(text).toContain('- ID: maze.standard');
  });

  it('formats JSON from a workbench snapshot', () => {
    const text = createReportText(snapshot, 'json', '2026-06-16T00:00:00.000Z');
    const report = JSON.parse(text) as { generatedAt: string; project: { name: string } };

    expect(report.generatedAt).toBe('2026-06-16T00:00:00.000Z');
    expect(report.project.name).toBe('Maze');
  });
});
