import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { ReportViewModel } from '@labyrinth/workbench';

import { ReportPanel } from './ReportPanel.js';

const viewModel: ReportViewModel = {
  projectName: 'Clinic Wing',
  schemaVersion: '0.1.0',
  rulePresetName: 'Horror Clinic',
  summary: {
    errors: 1,
    warnings: 2,
    info: 3,
    suppressed: 1
  },
  diagnostics: [],
  exceptionCount: 1,
  markdownPreview: '# Labyrinth Composer Report\n\n## Project\n\n- Name: Clinic Wing\n',
  timeline: {
    beats: [
      {
        id: 'beat-1',
        name: 'First clue',
        intensity: 0.4,
        order: 1,
        diagnosticIds: []
      }
    ],
    minIntensity: 0.4,
    maxIntensity: 0.4,
    diagnosticCount: 0
  }
};

describe('ReportPanel smoke', () => {
  it('renders report summary and preview metadata', () => {
    const html = renderToStaticMarkup(
      <ReportPanel viewModel={viewModel} onExportReport={() => undefined} />
    );

    expect(html).toContain('Report');
    expect(html).toContain('Clinic Wing');
    expect(html).toContain('Horror Clinic');
    expect(html).toContain('1 exceptions');
    expect(html).toContain('1 beats');
    expect(html).toContain('Export Markdown');
    expect(html).toContain('Labyrinth Composer Report');
  });
});
