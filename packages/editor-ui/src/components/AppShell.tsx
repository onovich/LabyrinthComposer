import type { WorkbenchSnapshot } from '@labyrinth/workbench';

type AppShellProps = {
  snapshot: WorkbenchSnapshot;
};

export function AppShell({ snapshot }: AppShellProps) {
  const projectName = snapshot.project?.project.name ?? 'Labyrinth Composer';

  return (
    <div className="lc-shell">
      <aside className="lc-sidebar" aria-label="Project navigation">
        <div className="lc-brand">Labyrinth Composer</div>
        <div className="lc-sidebar-section">
          <div className="lc-section-label">Project</div>
          <div className="lc-project-title">{projectName}</div>
        </div>
        <div className="lc-sidebar-section">
          <div className="lc-section-label">Views</div>
          <button className="lc-nav-item lc-nav-item-active" type="button">
            Progression
          </button>
          <button className="lc-nav-item" type="button">
            Spatial
          </button>
        </div>
      </aside>
      <main className="lc-main">
        <header className="lc-topbar">
          <div className="lc-toolbar-group">
            <button className="lc-tool-button" type="button">
              Open
            </button>
            <button className="lc-tool-button" type="button">
              Save
            </button>
            <button className="lc-tool-button lc-tool-button-primary" type="button">
              Validate
            </button>
          </div>
          <div className="lc-status-pill">Phase 1 Skeleton</div>
        </header>
        <section className="lc-workbench">
          <div className="lc-graph-canvas" aria-label="Graph canvas">
            <div className="lc-empty-node">
              <span>Graph Canvas</span>
            </div>
          </div>
          <aside className="lc-right-panel" aria-label="Inspector and diagnostics">
            <section className="lc-panel-section">
              <div className="lc-section-label">Inspector</div>
              <p className="lc-panel-copy">Select an entity to edit its properties.</p>
            </section>
            <section className="lc-panel-section">
              <div className="lc-section-label">Diagnostics</div>
              <p className="lc-panel-copy">Run validation to inspect project diagnostics.</p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
