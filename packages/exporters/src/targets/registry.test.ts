import { describe, expect, it } from 'vitest';

import {
  SCHEMA_VERSION,
  type ProjectGraph,
  type RulePreset,
  type ValidationResult
} from '@labyrinth/schema';

import { createEngineExport } from '../engineExportModel.js';
import { formatEngineExportJson } from '../engineJsonExport.js';
import {
  createExportTargetText,
  findExportTarget,
  formatExportTargetChoices,
  formatExportTargetList,
  listExportTargets
} from './registry.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'target-registry',
    name: 'Target Registry'
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

const rulePreset: RulePreset = {
  id: 'maze.standard',
  name: 'Standard Maze',
  enabledRuleIds: [],
  thresholds: {}
};

describe('export target registry', () => {
  it('lists implemented targets without exposing generator functions', () => {
    expect(listExportTargets()).toEqual([
      {
        id: 'engine-json',
        label: 'Engine JSON',
        description:
          'Stable engine-facing JSON DTO generated from project, validation, and ruleset state.',
        mediaType: 'application/json',
        fileExtension: '.json',
        packageArtifactKind: 'engineExport',
        packageArtifactPath: ['exports', 'engine-export.json']
      }
    ]);
    expect(formatExportTargetChoices()).toBe('engine-json');
    expect(formatExportTargetList()).toContain('engine-json');
  });

  it('keeps engine-json output compatible with the existing formatter', () => {
    const generatedAt = '2026-06-16T00:00:00.000Z';
    const registryText = createExportTargetText('engine-json', {
      project,
      validation,
      rulePreset,
      generatedAt
    });
    const directText = formatEngineExportJson(
      createEngineExport(project, validation, rulePreset, generatedAt)
    );

    expect(registryText).toBe(directText);
  });

  it('returns undefined for unsupported targets so hosts can own IO errors', () => {
    expect(findExportTarget('unity-scene')).toBeUndefined();
  });
});
