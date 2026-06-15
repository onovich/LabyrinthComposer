import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { RulePresetViewModel } from '@labyrinth/workbench';

import { RulePresetPanel } from './RulePresetPanel.js';

const viewModel: RulePresetViewModel = {
  currentPreset: {
    id: 'zelda.mini-dungeon',
    name: 'Zelda Mini Dungeon',
    description: 'Checks item gates and progression pacing.',
    enabledRuleIds: ['hint.token-use-too-late'],
    thresholds: {
      maxTokenUseDistance: 4
    }
  },
  options: [
    {
      id: 'zelda.mini-dungeon',
      name: 'Zelda Mini Dungeon',
      description: 'Checks item gates and progression pacing.',
      active: true
    }
  ],
  thresholds: [
    {
      key: 'maxTokenUseDistance',
      ruleId: 'hint.token-use-too-late',
      value: 4,
      overrideValue: 3
    }
  ],
  overrides: [],
  enabledRuleIds: ['hint.token-use-too-late']
};

describe('RulePresetPanel smoke', () => {
  it('renders preset metadata, enabled rules, and editable thresholds', () => {
    const html = renderToStaticMarkup(
      <RulePresetPanel
        viewModel={viewModel}
        onSelectPreset={() => undefined}
        onUpdateThreshold={() => undefined}
      />
    );

    expect(html).toContain('Rule Preset');
    expect(html).toContain('Zelda Mini Dungeon');
    expect(html).toContain('hint.token-use-too-late');
    expect(html).toContain('maxTokenUseDistance');
    expect(html).toContain('value="3"');
  });
});
