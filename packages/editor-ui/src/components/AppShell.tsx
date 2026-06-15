import type { EntityRef, ProjectGraph } from '@labyrinth/schema';
import {
  createDiagnosticViewModels,
  createGraphViewModel,
  createValidationSummary,
  type WorkbenchSnapshot
} from '@labyrinth/workbench';
import {
  CirclePlus,
  FolderOpen,
  Gauge,
  GitBranchPlus,
  KeyRound,
  LayoutDashboard,
  RotateCcw,
  RotateCw,
  Save,
  SaveAll,
  Shapes,
  ShieldCheck,
  Sparkle,
  Waypoints
} from 'lucide-react';

import { Dashboard, type TemplateCardViewModel } from './Dashboard.js';
import { GraphCanvas } from '../graph/GraphCanvas.js';
import { DiagnosticsPanel } from './DiagnosticsPanel.js';
import { InspectorPanel } from './InspectorPanel.js';

type AppShellProps = {
  showDashboard: boolean;
  templates: TemplateCardViewModel[];
  snapshot: WorkbenchSnapshot;
  selectedEntity: EntityRef | null;
  selectedDiagnosticId: string | null;
  projectPath: string | undefined;
  operationMessage: string;
  canUndo: boolean;
  canRedo: boolean;
  onSelectEntity(entity: EntityRef | null): void;
  onSelectDiagnostic(id: string): void;
  onSelectTemplate(id: string): void;
  onOpenDashboard(): void;
  onOpenProject(): void;
  onSaveProject(): void;
  onSaveAsProject(): void;
  onCreateSpace(): void;
  onCreateConnection(): void;
  onCreateGate(): void;
  onCreateToken(): void;
  onCreatePuzzle(): void;
  onCreateBeat(): void;
  onRunValidation(): void;
  onUpdateSpace(id: string, patch: Partial<ProjectGraph['spaces'][string]>): void;
  onUpdateConnection(id: string, patch: Partial<ProjectGraph['connections'][string]>): void;
  onUpdateGate(id: string, patch: Partial<ProjectGraph['gates'][string]>): void;
  onUpdateToken(id: string, patch: Partial<ProjectGraph['tokens'][string]>): void;
  onUpdatePuzzle(id: string, patch: Partial<ProjectGraph['puzzles'][string]>): void;
  onUpdateBeat(id: string, patch: Partial<ProjectGraph['beats'][string]>): void;
  onUndo(): void;
  onRedo(): void;
};

export function AppShell({
  showDashboard,
  templates,
  snapshot,
  selectedEntity,
  selectedDiagnosticId,
  projectPath,
  operationMessage,
  canUndo,
  canRedo,
  onSelectEntity,
  onSelectDiagnostic,
  onSelectTemplate,
  onOpenDashboard,
  onOpenProject,
  onSaveProject,
  onSaveAsProject,
  onCreateSpace,
  onCreateConnection,
  onCreateGate,
  onCreateToken,
  onCreatePuzzle,
  onCreateBeat,
  onRunValidation,
  onUpdateSpace,
  onUpdateConnection,
  onUpdateGate,
  onUpdateToken,
  onUpdatePuzzle,
  onUpdateBeat,
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

  if (showDashboard) {
    return (
      <Dashboard
        operationMessage={operationMessage}
        templates={templates}
        onOpenProject={onOpenProject}
        onSelectTemplate={onSelectTemplate}
      />
    );
  }

  return (
    <div className="lc-shell">
      <aside className="lc-sidebar" aria-label="Project navigation">
        <div className="lc-brand">Labyrinth Composer</div>
        <div className="lc-sidebar-section">
          <div className="lc-section-label">Project</div>
          <div className="lc-project-title">{projectName}</div>
          <div className="lc-project-path">{projectPath ?? 'Local draft'}</div>
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
            <button className="lc-tool-button" onClick={onOpenDashboard} type="button">
              <LayoutDashboard size={14} />
              Dashboard
            </button>
            <button className="lc-tool-button" onClick={onOpenProject} type="button">
              <FolderOpen size={14} />
              Open Project
            </button>
            <button className="lc-tool-button" onClick={onSaveProject} type="button">
              <Save size={14} />
              Save
            </button>
            <button className="lc-tool-button" onClick={onSaveAsProject} type="button">
              <SaveAll size={14} />
              Save As
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
            <button className="lc-tool-button" onClick={onCreateBeat} type="button">
              <Gauge size={14} />
              Beat
            </button>
          </div>
          <div className={`lc-status-pill ${summary.ok ? '' : 'lc-status-pill-warning'}`}>
            <Waypoints size={12} />
            {summary.ok
              ? snapshot.dirty
                ? 'Unsaved changes'
                : operationMessage
              : `${summary.errorCount} errors / ${summary.warningCount} warnings`}
          </div>
        </header>
        <section className="lc-workbench">
          <GraphCanvas
            graph={graph}
            onSelectEntity={onSelectEntity}
            selectedEntity={selectedEntity}
          />
          <aside className="lc-right-panel" aria-label="Inspector">
            <InspectorPanel
              project={snapshot.project}
              selectedEntity={selectedEntity}
              onUpdateBeat={onUpdateBeat}
              onUpdateConnection={onUpdateConnection}
              onUpdateGate={onUpdateGate}
              onUpdatePuzzle={onUpdatePuzzle}
              onUpdateSpace={onUpdateSpace}
              onUpdateToken={onUpdateToken}
            />
          </aside>
          <div className="lc-validation-panel">
            <DiagnosticsPanel
              diagnostics={diagnostics}
              selectedDiagnosticId={selectedDiagnosticId}
              summary={summary}
              onSelectDiagnostic={onSelectDiagnostic}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
