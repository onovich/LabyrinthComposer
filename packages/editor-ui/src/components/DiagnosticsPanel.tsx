import type { DiagnosticViewModel, ValidationSummaryViewModel } from '@labyrinth/workbench';
import { useState } from 'react';

type DiagnosticsPanelProps = {
  summary: ValidationSummaryViewModel;
  diagnostics: DiagnosticViewModel[];
  selectedDiagnosticId: string | null;
  onSelectDiagnostic(id: string): void;
  onMarkException(id: string): void;
};

function formatEntityList(entities: { kind: string; id: string }[]): string {
  if (entities.length === 0) {
    return 'None';
  }

  return entities.map((entity) => `${entity.kind}:${entity.id}`).join(', ');
}

function formatIdList(ids: string[]): string {
  return ids.length > 0 ? ids.join(', ') : 'None';
}

export function DiagnosticsPanel({
  summary,
  diagnostics,
  selectedDiagnosticId,
  onSelectDiagnostic,
  onMarkException
}: DiagnosticsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'suppressed'>('all');
  const visibleDiagnostics = diagnostics.filter((diagnostic) =>
    filter === 'all'
      ? true
      : filter === 'suppressed'
        ? diagnostic.suppressed === true
        : diagnostic.suppressed !== true
  );

  return (
    <section className="lc-panel-section">
      <div className="lc-section-label">Diagnostics</div>
      <div className="lc-validation-grid" aria-label="Validation summary">
        <div className="lc-validation-metric">
          <span>Reachable spaces</span>
          <strong>{summary.reachableSpaces.length}</strong>
          <small>{formatIdList(summary.reachableSpaces)}</small>
        </div>
        <div className="lc-validation-metric">
          <span>Acquired tokens</span>
          <strong>{summary.acquiredTokens.length}</strong>
          <small>{formatIdList(summary.acquiredTokens)}</small>
        </div>
        <div className="lc-validation-metric">
          <span>Opened gates</span>
          <strong>{summary.openedGates.length}</strong>
          <small>{formatIdList(summary.openedGates)}</small>
        </div>
        <div className="lc-validation-metric">
          <span>Solved puzzles</span>
          <strong>{summary.solvedPuzzles.length}</strong>
          <small>{formatIdList(summary.solvedPuzzles)}</small>
        </div>
      </div>
      {diagnostics.length === 0 ? (
        <p className="lc-panel-copy">No diagnostics. The current graph validates cleanly.</p>
      ) : (
        <>
          <div className="lc-filter-row" aria-label="Diagnostic filter">
            {(['all', 'open', 'suppressed'] as const).map((item) => (
              <button
                className={filter === item ? 'lc-filter-active' : ''}
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="lc-diagnostic-list">
            {visibleDiagnostics.map((diagnostic) => (
              <div
                className={`lc-diagnostic-item lc-diagnostic-${diagnostic.severity} ${
                  selectedDiagnosticId === diagnostic.id ? 'lc-diagnostic-selected' : ''
                }`}
                key={diagnostic.id}
              >
                <button
                  className="lc-diagnostic-main"
                  onClick={() => onSelectDiagnostic(diagnostic.id)}
                  type="button"
                >
                  <div className="lc-diagnostic-header">
                    <span>
                      {diagnostic.severity}
                      {diagnostic.suppressed === true ? ' / suppressed' : ''}
                    </span>
                    <code>{diagnostic.ruleId}</code>
                  </div>
                  <p>{diagnostic.message}</p>
                  <dl className="lc-diagnostic-details">
                    <dt>Affected</dt>
                    <dd>{formatEntityList(diagnostic.affectedEntities)}</dd>
                    <dt>Cause chain</dt>
                    <dd>
                      {diagnostic.causeChain.length === 0
                        ? 'None'
                        : diagnostic.causeChain
                            .map(
                              (step) => `${step.entity.kind}:${step.entity.id} - ${step.message}`
                            )
                            .join(' / ')}
                    </dd>
                    <dt>Suggestions</dt>
                    <dd>
                      {diagnostic.suggestions.length === 0
                        ? 'None'
                        : diagnostic.suggestions
                            .map((suggestion) => `${suggestion.kind} - ${suggestion.message}`)
                            .join(' / ')}
                    </dd>
                    {diagnostic.exceptionId !== undefined ? (
                      <>
                        <dt>Exception</dt>
                        <dd>{diagnostic.exceptionId}</dd>
                      </>
                    ) : null}
                  </dl>
                </button>
                {diagnostic.suppressed !== true ? (
                  <button
                    className="lc-inline-action"
                    onClick={() => onMarkException(diagnostic.id)}
                    type="button"
                  >
                    Mark exception
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
