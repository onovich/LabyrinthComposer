import type { TimelineViewModel } from '@labyrinth/workbench';
import type { BeatKind, ProjectGraph } from '@labyrinth/schema';

type TimelinePanelProps = {
  viewModel: TimelineViewModel;
  onSelectBeat(id: string): void;
  onUpdateBeat(id: string, patch: Partial<ProjectGraph['beats'][string]>): void;
};

const beatKinds: BeatKind[] = ['discovery', 'threat', 'relief', 'puzzle', 'reward'];

export function TimelinePanel({ viewModel, onSelectBeat, onUpdateBeat }: TimelinePanelProps) {
  return (
    <section className="lc-panel-section">
      <div className="lc-section-label">Timeline</div>
      {viewModel.beats.length === 0 ? (
        <p className="lc-panel-copy">No beats yet.</p>
      ) : (
        <div className="lc-timeline-list">
          {viewModel.beats.map((beat) => (
            <div
              className={`lc-timeline-row ${beat.diagnosticIds.length > 0 ? 'lc-timeline-row-warning' : ''}`}
              key={beat.id}
            >
              <button
                className="lc-timeline-beat-button"
                onClick={() => onSelectBeat(beat.id)}
                type="button"
              >
                <span>{beat.order}</span>
                <strong>{beat.name}</strong>
              </button>
              <div className="lc-timeline-meter" aria-label={`${beat.name} intensity`}>
                <span style={{ width: `${Math.round(beat.intensity * 100)}%` }} />
              </div>
              <div className="lc-timeline-controls">
                <select
                  value={beat.kind ?? ''}
                  onChange={(event) =>
                    onUpdateBeat(beat.id, {
                      kind:
                        event.target.value.length === 0
                          ? undefined
                          : (event.target.value as BeatKind)
                    })
                  }
                >
                  <option value="">kind</option>
                  {beatKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
                <input
                  max="1"
                  min="0"
                  step="0.05"
                  type="number"
                  value={beat.intensity}
                  onChange={(event) =>
                    onUpdateBeat(beat.id, { intensity: Number(event.target.value) })
                  }
                />
                <input
                  min="1"
                  step="1"
                  type="number"
                  value={beat.order}
                  onChange={(event) => onUpdateBeat(beat.id, { order: Number(event.target.value) })}
                />
              </div>
              {beat.diagnosticIds.length > 0 ? (
                <small>{beat.diagnosticIds.length} diagnostics</small>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
