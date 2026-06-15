import type { DiagnosticViewModel, ValidationSummaryViewModel } from '@labyrinth/workbench';

type DiagnosticsPanelProps = {
  summary: ValidationSummaryViewModel;
  diagnostics: DiagnosticViewModel[];
  selectedDiagnosticId: string | null;
  onSelectDiagnostic(id: string): void;
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
  onSelectDiagnostic
}: DiagnosticsPanelProps) {
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
        <div className="lc-diagnostic-list">
          {diagnostics.map((diagnostic) => (
            <button
              className={`lc-diagnostic-item lc-diagnostic-${diagnostic.severity} ${
                selectedDiagnosticId === diagnostic.id ? 'lc-diagnostic-selected' : ''
              }`}
              key={diagnostic.id}
              onClick={() => onSelectDiagnostic(diagnostic.id)}
              type="button"
            >
              <div className="lc-diagnostic-header">
                <span>{diagnostic.severity}</span>
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
                        .map((step) => `${step.entity.kind}:${step.entity.id} - ${step.message}`)
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
              </dl>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
