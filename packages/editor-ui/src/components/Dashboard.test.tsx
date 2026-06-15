import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

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

describe('Dashboard smoke', () => {
  it('renders the template entry surface before the workbench', () => {
    const html = renderToStaticMarkup(
      <Dashboard
        operationMessage="Ready"
        templates={templates}
        onOpenSample={() => undefined}
        onSelectTemplate={() => undefined}
      />
    );

    expect(html).toContain('Choose a starting structure');
    expect(html).toContain('Horror Puzzle');
    expect(html).toContain('Start Blank');
    expect(html).toContain('Open sample project');
  });
});
