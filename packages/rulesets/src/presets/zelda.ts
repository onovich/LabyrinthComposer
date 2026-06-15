import type { RulePreset } from '@labyrinth/schema';

export const zeldaMiniDungeonPreset: RulePreset = {
  id: 'zelda.mini-dungeon',
  name: 'Zelda Mini Dungeon',
  description: 'Item, ability, and gate progression checks for compact dungeon routes.',
  enabledRuleIds: [
    'hint.gate-too-late',
    'hint.token-use-too-late',
    'backtracking.long-token-return'
  ],
  thresholds: {
    maxTokenUseDistance: 4,
    minGatePreviewDistance: 1,
    maxUnspentTokenDistance: 6,
    maxBacktrackDistance: 5
  },
  severityOverrides: {
    'hint.gate-too-late': 'warning',
    'hint.token-use-too-late': 'warning',
    'backtracking.long-token-return': 'info'
  }
};
