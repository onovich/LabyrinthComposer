import { describe, expect, it } from 'vitest';

import { DEFAULT_RULE_PRESET_ID, getRulePreset, listRulePresets, rulePresets } from './index.js';

describe('rule presets', () => {
  it('lists the three phase 2 presets in stable order', () => {
    expect(rulePresets.map((preset) => preset.id)).toEqual([
      'maze.standard',
      'zelda.mini-dungeon',
      'horror.clinic'
    ]);
  });

  it('resolves unknown preset ids to the default maze preset', () => {
    expect(DEFAULT_RULE_PRESET_ID).toBe('maze.standard');
    expect(getRulePreset('unknown.preset').id).toBe('maze.standard');
  });

  it('returns cloned preset data so callers cannot mutate the registry', () => {
    const [firstPreset] = listRulePresets();

    expect(firstPreset).toBeDefined();
    if (firstPreset === undefined) {
      throw new Error('Expected a preset fixture.');
    }

    firstPreset.enabledRuleIds.push('test.mutation');
    firstPreset.thresholds.maxBacktrackDistance = 99;

    expect(getRulePreset('maze.standard').enabledRuleIds).not.toContain('test.mutation');
    expect(getRulePreset('maze.standard').thresholds.maxBacktrackDistance).toBe(5);
  });
});
