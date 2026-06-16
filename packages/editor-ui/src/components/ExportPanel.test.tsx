import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ExportPanel } from './ExportPanel.js';

describe('ExportPanel smoke', () => {
  it('renders engine export summary and action', () => {
    const html = renderToStaticMarkup(
      <ExportPanel
        viewModel={{
          projectName: 'Dungeon',
          spaces: 3,
          connections: 2,
          gates: 1,
          tokens: 4,
          puzzles: 0,
          beats: 2,
          diagnostics: 0,
          validationOk: true
        }}
        onExportEngineJson={() => undefined}
      />
    );

    expect(html).toContain('Export');
    expect(html).toContain('Engine JSON');
    expect(html).toContain('Spaces');
    expect(html).toContain('Dungeon');
  });
});
