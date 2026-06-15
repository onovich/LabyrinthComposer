import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { TimelineViewModel } from '@labyrinth/workbench';

import { TimelinePanel } from './TimelinePanel.js';

const viewModel: TimelineViewModel = {
  beats: [
    {
      id: 'beat-1',
      name: 'Find the brass key',
      spaceId: 'start',
      kind: 'discovery',
      intensity: 0.35,
      order: 1,
      diagnosticIds: []
    },
    {
      id: 'beat-2',
      name: 'Ambush corridor',
      spaceId: 'hall',
      kind: 'threat',
      intensity: 0.9,
      order: 2,
      diagnosticIds: ['timeline.intensity-spike.beat-2']
    }
  ],
  minIntensity: 0.35,
  maxIntensity: 0.9,
  diagnosticCount: 1
};

describe('TimelinePanel smoke', () => {
  it('renders ordered beats, intensity controls, and diagnostic count', () => {
    const html = renderToStaticMarkup(
      <TimelinePanel
        viewModel={viewModel}
        onSelectBeat={() => undefined}
        onUpdateBeat={() => undefined}
      />
    );

    expect(html).toContain('Timeline');
    expect(html).toContain('Find the brass key');
    expect(html).toContain('Ambush corridor');
    expect(html).toContain('1 diagnostics');
    expect(html).toContain('value="threat"');
  });
});
