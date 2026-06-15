import { getRulePreset, listRulePresets } from '@labyrinth/rulesets';
import type { ProjectGraph, RulePreset, RulePresetOverride } from '@labyrinth/schema';

export type RuleThresholdViewModel = {
  key: string;
  ruleId: string;
  value: number;
  overrideValue?: number;
};

export type RulePresetOptionViewModel = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
};

export type RulePresetViewModel = {
  currentPreset: RulePreset;
  options: RulePresetOptionViewModel[];
  thresholds: RuleThresholdViewModel[];
  overrides: RulePresetOverride[];
  enabledRuleIds: string[];
};

const thresholdRuleIds: Record<string, string> = {
  flatIntensityDelta: 'timeline.intensity-flat',
  highIntensityThreshold: 'timeline.intensity-spike',
  maxBacktrackDistance: 'backtracking.long-token-return',
  maxClueToUseDistance: 'hint.token-use-too-late',
  maxConsecutiveHighIntensityBeats: 'timeline.intensity-spike',
  maxDeadEndDepth: 'backtracking.dead-end-depth',
  maxTokenUseDistance: 'hint.token-use-too-late',
  maxUnspentTokenDistance: 'hint.token-use-too-late',
  minGatePreviewDistance: 'hint.gate-too-late',
  minReliefAfterSpike: 'timeline.intensity-spike'
};

export function createRulePresetViewModel(project: ProjectGraph): RulePresetViewModel {
  const currentPreset = getRulePreset(project.rulePresetId);
  const overrides = project.ruleOverrides ?? [];
  const thresholdOverrides = new Map(
    overrides.flatMap((override) =>
      Object.entries(override.thresholdOverrides ?? {}).map(([key, value]) => [key, value])
    )
  );

  return {
    currentPreset,
    options: listRulePresets().map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      active: preset.id === currentPreset.id
    })),
    thresholds: Object.entries(currentPreset.thresholds)
      .map(([key, value]) => ({
        key,
        ruleId: thresholdRuleIds[key] ?? currentPreset.enabledRuleIds[0] ?? currentPreset.id,
        value,
        overrideValue: thresholdOverrides.get(key)
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
    overrides: [...overrides].sort((left, right) => left.ruleId.localeCompare(right.ruleId)),
    enabledRuleIds: [...currentPreset.enabledRuleIds].sort()
  };
}
