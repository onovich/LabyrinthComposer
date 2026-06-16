import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SCHEMA_VERSION, type ProjectGraph, type RulePreset, type ValidationResult } from '@labyrinth/schema';

import { createEngineExport } from './engineExportModel.js';
import { formatEngineExportJson } from './engineJsonExport.js';

const project: ProjectGraph = {
  schemaVersion: SCHEMA_VERSION,
  project: {
    id: 'engine-fixture',
    name: 'Engine Fixture'
  },
  rulePresetId: 'zelda.mini-dungeon',
  startSpaceId: 'space-b',
  targetSpaceIds: ['space-a'],
  spaces: {
    'space-b': {
      id: 'space-b',
      name: 'Second',
      tags: ['late', 'early']
    },
    'space-a': {
      id: 'space-a',
      name: 'First'
    }
  },
  connections: {
    'space-b-space-a': {
      id: 'space-b-space-a',
      fromSpaceId: 'space-b',
      toSpaceId: 'space-a',
      gateId: 'gate-b'
    }
  },
  gates: {
    'gate-b': {
      id: 'gate-b',
      name: 'Gate B',
      kind: 'lock',
      requiredTokenIds: ['token-b', 'token-a']
    }
  },
  tokens: {
    'token-b': {
      id: 'token-b',
      name: 'Token B',
      kind: 'item',
      locationSpaceId: 'space-b'
    },
    'token-a': {
      id: 'token-a',
      name: 'Token A',
      kind: 'item',
      locationSpaceId: 'space-a'
    }
  },
  puzzles: {
    puzzle: {
      id: 'puzzle',
      name: 'Puzzle',
      locationSpaceId: 'space-a',
      requiredTokenIds: ['token-b', 'token-a'],
      outputTokenIds: ['token-b']
    }
  },
  beats: {
    later: {
      id: 'later',
      name: 'Later',
      intensity: 0.8,
      order: 2
    },
    earlier: {
      id: 'earlier',
      name: 'Earlier',
      intensity: 0.2,
      order: 1
    }
  }
};

const validation: ValidationResult = {
  ok: false,
  reachableSpaces: ['space-b', 'space-a'],
  acquiredTokens: ['token-b', 'token-a'],
  openedGates: ['gate-b'],
  solvedPuzzles: ['puzzle'],
  trace: [],
  diagnostics: [
    {
      id: 'warning-b',
      ruleId: 'hint.token-use-too-late',
      severity: 'warning',
      message: 'Token is used late.',
      affectedEntities: [
        { kind: 'gate', id: 'gate-b' },
        { kind: 'token', id: 'token-a' }
      ],
      causeChain: [],
      suggestions: [
        {
          kind: 'add_hint',
          message: 'Add a hint near the gate.',
          targetEntities: [{ kind: 'gate', id: 'gate-b' }]
        }
      ],
      suppressed: true,
      exceptionId: 'exception-1'
    }
  ]
};

const rulePreset: RulePreset = {
  id: 'zelda.mini-dungeon',
  name: 'Zelda Mini Dungeon',
  enabledRuleIds: ['hint.token-use-too-late'],
  thresholds: {}
};

describe('engine export model', () => {
  it('creates a stable engine DTO without UI state', () => {
    const engineExport = createEngineExport(
      project,
      validation,
      rulePreset,
      '2026-06-16T00:00:00.000Z'
    );

    expect(engineExport.sourceProject).toEqual({
      id: 'engine-fixture',
      name: 'Engine Fixture',
      schemaVersion: SCHEMA_VERSION,
      rulePresetId: 'zelda.mini-dungeon',
      rulePresetName: 'Zelda Mini Dungeon'
    });
    expect(engineExport.spaces.map((space) => space.id)).toEqual(['space-a', 'space-b']);
    expect(engineExport.spaces[1]?.tags).toEqual(['early', 'late']);
    expect(engineExport.gates[0]?.requiredTokenIds).toEqual(['token-a', 'token-b']);
    expect(engineExport.beats.map((beat) => beat.id)).toEqual(['earlier', 'later']);
    expect(engineExport.validation.diagnostics[0]).toEqual(
      expect.objectContaining({
        id: 'warning-b',
        suppressed: true,
        exceptionId: 'exception-1'
      })
    );

    const json = formatEngineExportJson(engineExport);

    expect(json).toContain('"exportVersion": "0.1.0"');
    expect(json).not.toContain('reactFlow');
    expect(json).not.toContain('selectedEntity');
    expect(json).not.toContain('viewport');
  });

  it('keeps the checked-in importer sample aligned with the engine export contract', () => {
    const importerProject: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'importer-sample',
        name: 'Importer Sample'
      },
      rulePresetId: 'zelda.mini-dungeon',
      startSpaceId: 'entry',
      targetSpaceIds: ['locked-door'],
      spaces: {
        entry: {
          id: 'entry',
          name: 'Entry Hall',
          tags: ['start']
        },
        'key-room': {
          id: 'key-room',
          name: 'Key Room'
        },
        'locked-door': {
          id: 'locked-door',
          name: 'Locked Door'
        }
      },
      connections: {
        'entry-key-room': {
          id: 'entry-key-room',
          fromSpaceId: 'entry',
          toSpaceId: 'key-room'
        },
        'key-room-locked-door': {
          id: 'key-room-locked-door',
          fromSpaceId: 'key-room',
          toSpaceId: 'locked-door',
          gateId: 'brass-key-gate'
        }
      },
      gates: {
        'brass-key-gate': {
          id: 'brass-key-gate',
          name: 'Brass Key Gate',
          kind: 'lock',
          requiredTokenIds: ['brass-key']
        }
      },
      tokens: {
        'brass-key': {
          id: 'brass-key',
          name: 'Brass Key',
          kind: 'item',
          locationSpaceId: 'key-room'
        }
      },
      puzzles: {},
      beats: {
        'beat-entry': {
          id: 'beat-entry',
          name: 'Enter the hall',
          spaceId: 'entry',
          kind: 'discovery',
          intensity: 0.2,
          order: 1
        },
        'beat-door': {
          id: 'beat-door',
          name: 'Open the locked door',
          spaceId: 'locked-door',
          kind: 'reward',
          intensity: 0.5,
          order: 2
        }
      }
    };
    const importerValidation: ValidationResult = {
      ok: true,
      reachableSpaces: ['entry', 'key-room', 'locked-door'],
      acquiredTokens: ['brass-key'],
      openedGates: ['brass-key-gate'],
      solvedPuzzles: [],
      trace: [],
      diagnostics: []
    };
    const samplePath = join(process.cwd(), 'examples/engine-export/sample-engine-export.json');
    const expected = JSON.parse(readFileSync(samplePath, 'utf8')) as unknown;
    const actual = JSON.parse(
      formatEngineExportJson(
        createEngineExport(
          importerProject,
          importerValidation,
          rulePreset,
          '2026-06-16T00:00:00.000Z'
        )
      )
    ) as unknown;

    expect(actual).toEqual(expected);
  });
});
