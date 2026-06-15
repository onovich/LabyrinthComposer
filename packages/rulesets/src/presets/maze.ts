import type { RulePreset } from '@labyrinth/schema';

export const mazeStandardPreset: RulePreset = {
  id: 'maze.standard',
  name: 'Standard Maze',
  description: 'General spatial flow checks for reachability, dead ends, and return pressure.',
  enabledRuleIds: [
    'reachability.target-unreachable',
    'backtracking.long-token-return',
    'backtracking.dead-end-depth'
  ],
  thresholds: {
    maxBacktrackDistance: 5,
    maxDeadEndDepth: 4
  },
  severityOverrides: {
    'backtracking.long-token-return': 'warning',
    'backtracking.dead-end-depth': 'info'
  }
};
