import type { RulePreset } from '@labyrinth/schema';

export const horrorClinicPreset: RulePreset = {
  id: 'horror.clinic',
  name: 'Horror Clinic',
  description: 'Knowledge-gate and pacing checks for clue-driven horror routes.',
  enabledRuleIds: [
    'hint.token-use-too-late',
    'timeline.intensity-flat',
    'timeline.intensity-spike'
  ],
  thresholds: {
    maxClueToUseDistance: 5,
    maxConsecutiveHighIntensityBeats: 3,
    minReliefAfterSpike: 1,
    flatIntensityDelta: 0.1
  },
  severityOverrides: {
    'hint.token-use-too-late': 'warning',
    'timeline.intensity-flat': 'info',
    'timeline.intensity-spike': 'warning'
  }
};
