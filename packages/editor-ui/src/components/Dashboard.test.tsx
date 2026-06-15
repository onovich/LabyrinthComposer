import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { RulePresetViewModel } from '@labyrinth/workbench';

import { Dashboard, type TemplateCardViewModel } from './Dashboard.js';

const templates: TemplateCardViewModel[] = [
  {
    id: 'horror',
    name: 'Horror Puzzle',
    category: 'Investigation',
    description: 'Knowledge and state gates in a horror clinic route.',
    stats: 'sample project'
  },
  {
    id: 'blank',
    name: 'Start Blank',
    category: 'Blank',
    description: 'Begin with a single start node.',
    stats: '1 space'
  }
];

const rulePreset: RulePresetViewModel = {
  currentPreset: {
    id: 'maze.standard',
    name: 'Standard Maze',
    description: 'General spatial maze checks.',
    enabledRuleIds: ['backtracking.long-token-return'],
    thresholds: {
      maxBacktrackDistance: 5
    }
  },
  options: [
    {
      id: 'maze.standard',
      name: 'Standard Maze',
      description: 'General spatial maze checks.',
      active: true
    },
    {
      id: 'horror.clinic',
      name: 'Horror Clinic',
      description: 'Investigation pacing checks.',
      active: false
    }
  ],
  thresholds: [
    {
      key: 'maxBacktrackDistance',
      ruleId: 'backtracking.long-token-return',
      value: 5
    }
  ],
  overrides: [],
  enabledRuleIds: ['backtracking.long-token-return']
};

describe('Dashboard smoke', () => {
  it('renders the template entry surface before the workbench', () => {
    const html = renderToStaticMarkup(
      <Dashboard
        operationMessage="Ready"
        rulePreset={rulePreset}
        templates={templates}
        onOpenProject={() => undefined}
        onSelectRulePreset={() => undefined}
        onSelectTemplate={() => undefined}
      />
    );

    expect(html).toContain('Choose a starting structure');
    expect(html).toContain('Horror Puzzle');
    expect(html).toContain('Start Blank');
    expect(html).toContain('Open project');
    expect(html).toContain('Rule preset');
    expect(html).toContain('Standard Maze');
  });
});
