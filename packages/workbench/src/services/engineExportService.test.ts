import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph, type ValidationResult } from '@labyrinth/schema';

import {
  createEngineExportText,
  createExportTargetTextFromSnapshot
} from './engineExportService.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'engine-desktop-test',
    name: 'Engine Desktop Test'
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

describe('createEngineExportText', () => {
  it('formats engine JSON from a workbench snapshot', () => {
    const text = createEngineExportText(
      {
        project,
        validation,
        rulePreset: {
          id: 'maze.standard',
          name: 'Standard Maze',
          enabledRuleIds: [],
          thresholds: {}
        }
      },
      '2026-06-16T00:00:00.000Z'
    );
    const engineExport = JSON.parse(text) as {
      generatedAt: string;
      sourceProject: { id: string };
      spaces: Array<{ id: string }>;
    };

    expect(engineExport.generatedAt).toBe('2026-06-16T00:00:00.000Z');
    expect(engineExport.sourceProject.id).toBe('engine-desktop-test');
    expect(engineExport.spaces).toEqual([{ id: 'start', name: 'Start' }]);
  });

  it('uses the exporter target registry for target-specific generation', () => {
    const text = createExportTargetTextFromSnapshot(
      {
        project,
        validation,
        rulePreset: {
          id: 'maze.standard',
          name: 'Standard Maze',
          enabledRuleIds: [],
          thresholds: {}
        }
      },
      'engine-json',
      '2026-06-16T00:00:00.000Z'
    );
    const engineExport = JSON.parse(text) as {
      exportVersion: string;
      generatedAt: string;
    };

    expect(engineExport.exportVersion).toBe('0.1.0');
    expect(engineExport.generatedAt).toBe('2026-06-16T00:00:00.000Z');
  });
});
