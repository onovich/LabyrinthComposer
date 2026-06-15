import type { EntityRef, ProjectGraph } from '@labyrinth/schema';
import {
  createDiagnosticViewModels,
  createGraphViewModel,
  createValidationSummary,
  type WorkbenchSnapshot
} from '@labyrinth/workbench';
import {
  CirclePlus,
  GitBranchPlus,
  KeyRound,
  RotateCcw,
  RotateCw,
  Save,
  Shapes,
  ShieldCheck,
  Sparkle,
  Waypoints
} from 'lucide-react';

import { GraphCanvas } from '../graph/GraphCanvas.js';
import { DiagnosticsPanel } from './DiagnosticsPanel.js';
import { InspectorPanel } from './InspectorPanel.js';

type AppShellProps = {
  snapshot: WorkbenchSnapshot;
  selectedEntity: EntityRef | null;
  selectedDiagnosticId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onSelectEntity(entity: EntityRef | null): void;
  onSelectDiagnostic(id: string): void;
  onCreateSpace(): void;
  onCreateConnection(): void;
  onCreateGate(): void;
  onCreateToken(): void;
  onCreatePuzzle(): void;
  onRunValidation(): void;
  onUpdateSpace(id: string, patch: Partial<ProjectGraph['spaces'][string]>): void;
  onUndo(): void;
  onRedo(): void;
};

export function AppShell({
  snapshot,
  selectedEntity,
  selectedDiagnosticId,
  canUndo,
  canRedo,
  onSelectEntity,
  onSelectDiagnostic,
  onCreateSpace,
  onCreateConnection,
  onCreateGate,
  onCreateToken,
  onCreatePuzzle,
  onRunValidation,
  onUpdateSpace,
  onUndo,
  onRedo
}: AppShellProps) {
  const projectName = snapshot.project.project.name;
  const diagnostics = createDiagnosticViewModels(snapshot.validation);
  const selectedDiagnostic = diagnostics.find(
    (diagnostic) => diagnostic.id === selectedDiagnosticId
  );
  const summary = createValidationSummary(snapshot.validation);
  const graph = createGraphViewModel(snapshot.project, {
    validation: snapshot.validation,
    highlightedEntities: selectedDiagnostic?.highlightedEntities ?? []
  });
  const selectedSpace =
    selectedEntity?.kind === 'space' ? snapshot.project.spaces[selectedEntity.id] : undefined;

  return (
    <div className="lc-shell">
      <aside className="lc-sidebar" aria-label="Project navigation">
        <div className="lc-brand">Labyrinth Composer</div>
        <div className="lc-sidebar-section">
          <div className="lc-section-label">Project</div>
          <div className="lc-project-title">{projectName}</div>
          <div className="lc-project-meta">
            {Object.keys(snapshot.project.spaces).length} spaces -{' '}
            {Object.keys(snapshot.project.connections).length} connections
          </div>
        </div>
        <div className="lc-sidebar-section">
          <div className="lc-section-label">Outline</div>
          {Object.values(snapshot.project.spaces).map((space) => (
            <button
              className={`lc-nav-item ${selectedEntity?.kind === 'space' && selectedEntity.id === space.id ? 'lc-nav-item-active' : ''}`}
              key={space.id}
              onClick={() => onSelectEntity({ kind: 'space', id: space.id })}
              type="button"
            >
              {space.name}
            </button>
          ))}
        </div>
      </aside>
      <main className="lc-main">
        <header className="lc-topbar">
          <div className="lc-toolbar-group">
            <button className="lc-tool-button" type="button">
              <Save size={14} />
              Save
            </button>
            <button className="lc-tool-button" onClick={onRunValidation} type="button">
              <ShieldCheck size={14} />
              Validate
            </button>
            <button className="lc-tool-button" disabled={!canUndo} onClick={onUndo} type="button">
              <RotateCcw size={14} />
              Undo
            </button>
            <button className="lc-tool-button" disabled={!canRedo} onClick={onRedo} type="button">
              <RotateCw size={14} />
              Redo
            </button>
          </div>
          <div className="lc-toolbar-group">
            <button className="lc-tool-button" onClick={onCreateSpace} type="button">
              <CirclePlus size={14} />
              Space
            </button>
            <button className="lc-tool-button" onClick={onCreateConnection} type="button">
              <GitBranchPlus size={14} />
              Connection
            </button>
            <button className="lc-tool-button" onClick={onCreateGate} type="button">
              <KeyRound size={14} />
              Gate
            </button>
            <button className="lc-tool-button" onClick={onCreateToken} type="button">
              <Sparkle size={14} />
              Token
            </button>
            <button className="lc-tool-button" onClick={onCreatePuzzle} type="button">
              <Shapes size={14} />
              Puzzle
            </button>
          </div>
          <div className={`lc-status-pill ${summary.ok ? '' : 'lc-status-pill-warning'}`}>
            <Waypoints size={12} />
            {summary.ok
              ? snapshot.dirty
                ? 'Unsaved changes'
                : 'Ready'
              : `${summary.errorCount} errors / ${summary.warningCount} warnings`}
          </div>
        </header>
        <section className="lc-workbench">
          <GraphCanvas
            graph={graph}
            onSelectEntity={onSelectEntity}
            selectedEntity={selectedEntity}
          />
          <aside className="lc-right-panel" aria-label="Inspector and diagnostics">
            <InspectorPanel
              selectedEntity={selectedEntity}
              selectedSpace={selectedSpace}
              onUpdateSpace={onUpdateSpace}
            />
            <DiagnosticsPanel
              diagnostics={diagnostics}
              selectedDiagnosticId={selectedDiagnosticId}
              summary={summary}
              onSelectDiagnostic={onSelectDiagnostic}
            />
          </aside>
        </section>
      </main>
    </div>
  );
}
