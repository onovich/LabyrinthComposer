import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import { createRulePresetViewModel } from './rulePresetSelectors.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'ruleset-selector',
      name: 'Ruleset Selector'
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
    beats: {},
    rulePresetId: 'zelda.mini-dungeon',
    ruleOverrides: [
      {
        ruleId: 'hint.token-use-too-late',
        thresholdOverrides: {
          maxTokenUseDistance: 8
        }
      }
    ]
  };
}

describe('rule preset selectors', () => {
  it('projects active preset options and threshold overrides', () => {
    const viewModel = createRulePresetViewModel(projectFixture());

    expect(viewModel.currentPreset.id).toBe('zelda.mini-dungeon');
    expect(viewModel.options.find((option) => option.id === 'zelda.mini-dungeon')).toEqual(
      expect.objectContaining({
        active: true
      })
    );
    expect(viewModel.thresholds).toEqual(
      expect.arrayContaining([
        {
          key: 'maxTokenUseDistance',
          ruleId: 'hint.token-use-too-late',
          value: 4,
          overrideValue: 8
        }
      ])
    );
    expect(viewModel.enabledRuleIds).toContain('hint.token-use-too-late');
  });
});
