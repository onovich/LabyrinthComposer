import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { DiagnosticViewModel, ValidationSummaryViewModel } from '@labyrinth/workbench';

import { DiagnosticsPanel } from './DiagnosticsPanel.js';

const summary: ValidationSummaryViewModel = {
  ok: false,
  reachableSpaces: ['start'],
  acquiredTokens: ['key'],
  openedGates: ['gate-a'],
  solvedPuzzles: ['puzzle-a'],
  diagnosticCount: 1,
  errorCount: 1,
  warningCount: 0,
  infoCount: 0
};

const diagnostics: DiagnosticViewModel[] = [
  {
    id: 'target-unreachable',
    ruleId: 'reachability.target-unreachable',
    severity: 'error',
    message: 'Target space is unreachable.',
    affectedEntities: [{ kind: 'space', id: 'exit' }],
    causeChain: [
      {
        entity: { kind: 'connection', id: 'start-exit' },
        message: 'Connection is blocked'
      }
    ],
    suggestions: [
      {
        kind: 'add_connection',
        message: 'Add a route to the exit',
        targetEntities: [{ kind: 'space', id: 'exit' }]
      }
    ],
    highlightedEntities: [
      { kind: 'space', id: 'exit' },
      { kind: 'connection', id: 'start-exit' }
    ]
  }
];

describe('DiagnosticsPanel smoke', () => {
  it('renders validation progress, structured diagnostics, causes, and suggestions', () => {
    const html = renderToStaticMarkup(
      <DiagnosticsPanel
        diagnostics={diagnostics}
        selectedDiagnosticId="target-unreachable"
        summary={summary}
        onMarkException={() => undefined}
        onSelectDiagnostic={() => undefined}
      />
    );

    expect(html).toContain('Reachable spaces');
    expect(html).toContain('start');
    expect(html).toContain('reachability.target-unreachable');
    expect(html).toContain('space:exit');
    expect(html).toContain('connection:start-exit - Connection is blocked');
    expect(html).toContain('add_connection - Add a route to the exit');
    expect(html).toContain('Mark exception');
  });

  it('renders suppressed diagnostics with their exception id', () => {
    const diagnostic = diagnostics[0];

    if (diagnostic === undefined) {
      throw new Error('Expected one diagnostic fixture.');
    }

    const html = renderToStaticMarkup(
      <DiagnosticsPanel
        diagnostics={[
          {
            ...diagnostic,
            suppressed: true,
            exceptionId: 'exception-target-unreachable'
          }
        ]}
        selectedDiagnosticId={null}
        summary={summary}
        onMarkException={() => undefined}
        onSelectDiagnostic={() => undefined}
      />
    );

    expect(html).toContain('suppressed');
    expect(html).toContain('exception-target-unreachable');
  });
});
