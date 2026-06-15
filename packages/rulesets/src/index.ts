import type { RulePreset, RulePresetId } from '@labyrinth/schema';

import { horrorClinicPreset } from './presets/horror.js';
import { mazeStandardPreset } from './presets/maze.js';
import { zeldaMiniDungeonPreset } from './presets/zelda.js';

export const DEFAULT_RULE_PRESET_ID: RulePresetId = mazeStandardPreset.id;

export const rulePresets = [
  mazeStandardPreset,
  zeldaMiniDungeonPreset,
  horrorClinicPreset
] satisfies RulePreset[];

export function listRulePresets(): RulePreset[] {
  return rulePresets.map((preset) => ({
    ...preset,
    enabledRuleIds: [...preset.enabledRuleIds],
    thresholds: { ...preset.thresholds },
    severityOverrides:
      preset.severityOverrides === undefined ? undefined : { ...preset.severityOverrides }
  }));
}

export function getRulePreset(id: RulePresetId | undefined): RulePreset {
  const preset = rulePresets.find((item) => item.id === (id ?? DEFAULT_RULE_PRESET_ID));

  if (preset === undefined) {
    return mazeStandardPreset;
  }

  return {
    ...preset,
    enabledRuleIds: [...preset.enabledRuleIds],
    thresholds: { ...preset.thresholds },
    severityOverrides:
      preset.severityOverrides === undefined ? undefined : { ...preset.severityOverrides }
  };
}

export { horrorClinicPreset } from './presets/horror.js';
export { mazeStandardPreset } from './presets/maze.js';
export { zeldaMiniDungeonPreset } from './presets/zelda.js';
