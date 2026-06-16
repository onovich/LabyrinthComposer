import type { EntityRef, ProjectGraph } from '@labyrinth/schema';
import {
  createDiagnosticViewModels,
  createExportViewModel,
  createGraphViewModel,
  createReportViewModel,
  createReviewSummary,
  createReviewThreadViewModels,
  createRulePresetViewModel,
  createTimelineViewModel,
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

import { Dashboard, type RecentProjectViewModel, type TemplateCardViewModel } from './Dashboard.js';
import { ExportPanel } from './ExportPanel.js';
import { GraphCanvas } from '../graph/GraphCanvas.js';
import { DiagnosticsPanel } from './DiagnosticsPanel.js';
import { InspectorPanel } from './InspectorPanel.js';
import { ReportPanel } from './ReportPanel.js';
import { ReviewPanel } from './ReviewPanel.js';
import { RulePresetPanel } from './RulePresetPanel.js';
import { TimelinePanel } from './TimelinePanel.js';

type AppShellProps = {
  showDashboard: boolean;
  templates: TemplateCardViewModel[];
  recentProjects: RecentProjectViewModel[];
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
  onSelectDashboardRulePreset(rulePresetId: string): void;
  onSetRulePreset(rulePresetId: string): void;
  onUpdateRuleThreshold(ruleId: string, key: string, value: number): void;
  onMarkDiagnosticException(id: string): void;
  onExportReport(format: 'markdown' | 'json'): void;
  onExportEngineJson(): void;
  onAddReviewThread(target: EntityRef): void;
  onUpdateReviewThreadStatus(id: string, status: 'open' | 'resolved'): void;
  onAddReviewComment(threadId: string, body: string): void;
  onRemoveReviewComment(threadId: string, commentId: string): void;
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

function sortedEntries<T extends { id: string }>(record: Record<string, T>): T[] {
  return Object.values(record).sort((left, right) => left.id.localeCompare(right.id));
}

function isSelectedEntity(selectedEntity: EntityRef | null, entity: EntityRef): boolean {
  return selectedEntity?.kind === entity.kind && selectedEntity.id === entity.id;
}

export function AppShell({
  showDashboard,
  templates,
  recentProjects,
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
  onSelectDashboardRulePreset,
  onSetRulePreset,
  onUpdateRuleThreshold,
  onMarkDiagnosticException,
  onExportReport,
  onExportEngineJson,
  onAddReviewThread,
  onUpdateReviewThreadStatus,
  onAddReviewComment,
  onRemoveReviewComment,
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
  const rulePreset = createRulePresetViewModel(snapshot.project);
  const timeline = createTimelineViewModel(snapshot.project, snapshot.validation);
  const report = createReportViewModel(snapshot.project, snapshot.validation);
  const exportView = createExportViewModel(snapshot.project, snapshot.validation);
  const reviewThreads = createReviewThreadViewModels(snapshot.project, selectedEntity);
  const reviewSummary = createReviewSummary(snapshot.project);
  const graph = createGraphViewModel(snapshot.project, {
    validation: snapshot.validation,
    highlightedEntities: selectedDiagnostic?.highlightedEntities ?? []
  });
  const spaces = sortedEntries(snapshot.project.spaces);
  const connections = sortedEntries(snapshot.project.connections);
  const gates = sortedEntries(snapshot.project.gates);
  const tokens = sortedEntries(snapshot.project.tokens);
  const puzzles = sortedEntries(snapshot.project.puzzles);
  const beats = sortedEntries(snapshot.project.beats).sort(
    (left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id)
  );

  function connectionLabel(connection: ProjectGraph['connections'][string]): string {
    const from = snapshot.project.spaces[connection.fromSpaceId]?.name ?? connection.fromSpaceId;
    const to = snapshot.project.spaces[connection.toSpaceId]?.name ?? connection.toSpaceId;

    return `${from} -> ${to}`;
  }

  function outlineButton(entity: EntityRef, label: string, meta?: string) {
    return (
      <button
        className={`lc-nav-item ${isSelectedEntity(selectedEntity, entity) ? 'lc-nav-item-active' : ''}`}
        key={`${entity.kind}:${entity.id}`}
        onClick={() => onSelectEntity(entity)}
        type="button"
      >
        <span>{label}</span>
        {meta !== undefined ? <small>{meta}</small> : null}
      </button>
    );
  }

  if (showDashboard) {
    return (
      <Dashboard
        operationMessage={operationMessage}
        recentProjects={recentProjects}
        rulePreset={rulePreset}
        templates={templates}
        onOpenProject={onOpenProject}
        onSelectRulePreset={onSelectDashboardRulePreset}
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
          <div className="lc-outline-group">
            <div className="lc-outline-heading">Spaces</div>
            {spaces.map((space) =>
              outlineButton({ kind: 'space', id: space.id }, space.name, space.id)
            )}
          </div>
          {connections.length > 0 ? (
            <div className="lc-outline-group">
              <div className="lc-outline-heading">Connections</div>
              {connections.map((connection) =>
                outlineButton(
                  { kind: 'connection', id: connection.id },
                  connectionLabel(connection),
                  connection.gateId
                )
              )}
            </div>
          ) : null}
          {gates.length > 0 ? (
            <div className="lc-outline-group">
              <div className="lc-outline-heading">Gates</div>
              {gates.map((gate) => outlineButton({ kind: 'gate', id: gate.id }, gate.name, gate.kind))}
            </div>
          ) : null}
          {tokens.length > 0 ? (
            <div className="lc-outline-group">
              <div className="lc-outline-heading">Tokens</div>
              {tokens.map((token) =>
                outlineButton({ kind: 'token', id: token.id }, token.name, token.kind)
              )}
            </div>
          ) : null}
          {puzzles.length > 0 ? (
            <div className="lc-outline-group">
              <div className="lc-outline-heading">Puzzles</div>
              {puzzles.map((puzzle) =>
                outlineButton({ kind: 'puzzle', id: puzzle.id }, puzzle.name, puzzle.locationSpaceId)
              )}
            </div>
          ) : null}
          {beats.length > 0 ? (
            <div className="lc-outline-group">
              <div className="lc-outline-heading">Beats</div>
              {beats.map((beat) =>
                outlineButton(
                  { kind: 'beat', id: beat.id },
                  beat.name,
                  beat.order === undefined ? beat.kind : `#${beat.order}`
                )
              )}
            </div>
          ) : null}
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
          <div
            className={`lc-status-pill ${summary.ok ? '' : 'lc-status-pill-warning'} ${snapshot.status === 'validating' ? 'lc-status-pill-validating' : ''}`}
          >
            <Waypoints size={12} />
            {snapshot.status === 'validating'
              ? 'Validating'
              : summary.ok
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
          <aside className="lc-right-panel" aria-label="Project tools">
            <ExportPanel viewModel={exportView} onExportEngineJson={onExportEngineJson} />
            <ReviewPanel
              selectedEntity={selectedEntity}
              summary={reviewSummary}
              threads={reviewThreads}
              onAddComment={onAddReviewComment}
              onAddThread={onAddReviewThread}
              onRemoveComment={onRemoveReviewComment}
              onSelectTarget={onSelectEntity}
              onUpdateThreadStatus={onUpdateReviewThreadStatus}
            />
            <ReportPanel viewModel={report} onExportReport={onExportReport} />
            <RulePresetPanel
              viewModel={rulePreset}
              onSelectPreset={onSetRulePreset}
              onUpdateThreshold={onUpdateRuleThreshold}
            />
            <TimelinePanel
              viewModel={timeline}
              onSelectBeat={(id) => onSelectEntity({ kind: 'beat', id })}
              onUpdateBeat={onUpdateBeat}
            />
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
              onMarkException={onMarkDiagnosticException}
              onSelectDiagnostic={onSelectDiagnostic}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
