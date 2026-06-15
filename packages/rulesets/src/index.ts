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

const legacyPresetAliases: Record<string, RulePresetId> = {
  horror: horrorClinicPreset.id,
  maze: mazeStandardPreset.id,
  zelda: zeldaMiniDungeonPreset.id
};

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
  const resolvedId = id === undefined ? DEFAULT_RULE_PRESET_ID : legacyPresetAliases[id] ?? id;
  const preset = rulePresets.find((item) => item.id === resolvedId);

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
