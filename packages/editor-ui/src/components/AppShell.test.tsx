import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';
import { createWorkbenchStore } from '@labyrinth/workbench';

vi.mock('../graph/GraphCanvas.js', () => ({
  GraphCanvas: () => <div aria-label="Graph canvas" className="lc-graph-canvas" />
}));

import { AppShell } from './AppShell.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'app-shell-test',
      name: 'App Shell Test'
    },
    startSpaceId: 'start',
    targetSpaceIds: ['start'],
    spaces: {
      start: {
        id: 'start',
        name: 'Start'
      }
    },
    connections: {},
    gates: {},
    tokens: {},
    puzzles: {},
    beats: {
      intro: {
        id: 'intro',
        name: 'Intro',
        intensity: 0.25,
        kind: 'discovery',
        order: 1,
        spaceId: 'start'
      }
    }
  };
}

function renderAppShell() {
  const noop = () => undefined;
  const snapshot = createWorkbenchStore(projectFixture()).getSnapshot();

  return renderToStaticMarkup(
    <AppShell
      canRedo={false}
      canUndo={false}
      operationMessage="Ready"
      projectPath={undefined}
      selectedDiagnosticId={null}
      selectedEntity={{ kind: 'space', id: 'start' }}
      recentProjects={[]}
      showDashboard={false}
      snapshot={snapshot}
      templates={[]}
      onAddReviewComment={noop}
      onAddReviewThread={noop}
      onCreateBeat={noop}
      onCreateConnection={noop}
      onCreateGate={noop}
      onCreatePuzzle={noop}
      onCreateSpace={noop}
      onCreateToken={noop}
      onExportEngineJson={noop}
      onExportReport={noop}
      onMarkDiagnosticException={noop}
      onOpenDashboard={noop}
      onOpenProject={noop}
      onRedo={noop}
      onRemoveReviewComment={noop}
      onRunValidation={noop}
      onSaveAsProject={noop}
      onSaveProject={noop}
      onSelectDashboardRulePreset={noop}
      onSelectDiagnostic={noop}
      onSelectEntity={noop}
      onSelectTemplate={noop}
      onSetRulePreset={noop}
      onUndo={noop}
      onUpdateBeat={noop}
      onUpdateConnection={noop}
      onUpdateGate={noop}
      onUpdatePuzzle={noop}
      onUpdateReviewThreadStatus={noop}
      onUpdateRuleThreshold={noop}
      onUpdateSpace={noop}
      onUpdateToken={noop}
    />
  );
}

describe('AppShell workbench information architecture', () => {
  it('prioritizes production actions before tuning and inspection panels', () => {
    const html = renderAppShell();
    const toolsStart = html.indexOf('aria-label="Project tools"');
    const exportIndex = html.indexOf('>Export<', toolsStart);
    const selfReviewIndex = html.indexOf('>Self Review<', toolsStart);
    const reportIndex = html.indexOf('>Report<', toolsStart);
    const rulePresetIndex = html.indexOf('>Rule Preset<', toolsStart);
    const timelineIndex = html.indexOf('>Timeline<', toolsStart);
    const inspectorIndex = html.indexOf('>Inspector<', toolsStart);

    expect(toolsStart).toBeGreaterThan(-1);
    expect(exportIndex).toBeGreaterThan(-1);
    expect(selfReviewIndex).toBeGreaterThan(-1);
    expect(exportIndex).toBeLessThan(selfReviewIndex);
    expect(selfReviewIndex).toBeLessThan(reportIndex);
    expect(reportIndex).toBeLessThan(rulePresetIndex);
    expect(rulePresetIndex).toBeLessThan(timelineIndex);
    expect(timelineIndex).toBeLessThan(inspectorIndex);
  });
});
