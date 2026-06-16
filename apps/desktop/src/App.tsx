import {
  AppShell,
  type RecentProjectViewModel,
  type TemplateCardViewModel
} from '@labyrinth/editor-ui';
import {
  createHighlightedEntitiesForDiagnostic,
  createEngineExportText,
  createReportText,
  createValidationComposition,
  createWorkbenchStore,
  parseProjectText,
  type ReportFormat
} from '@labyrinth/workbench';
import {
  SCHEMA_VERSION,
  type EntityRef,
  type ProjectGraph,
  type ReviewThreadStatus
} from '@labyrinth/schema';
import { useEffect, useMemo, useRef, useState } from 'react';

import { createDesktopAdapters } from './bootstrap/createDesktopAdapters.js';
import type { DesktopPreferences } from './preferences/preferences.js';
import type {
  ValidationWorkerRequest,
  ValidationWorkerResponse
} from './workers/validationWorker.js';
import horrorClinicProjectText from '../../../packages/test-fixtures/samples/horror-clinic.lcproj.json?raw';
import narrativeProjectText from '../../../packages/test-fixtures/samples/narrative-knowledge-lock.lcproj.json?raw';
import zeldaProjectText from '../../../packages/test-fixtures/samples/zelda-mini-dungeon.lcproj.json?raw';

type TemplateDefinition = TemplateCardViewModel & {
  load(): ProjectGraph;
  path?: string;
};

function sanitizeIdSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createStarterProject(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'starter',
      name: 'Untitled Labyrinth'
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
    beats: {}
  };
}

function createLinearTemplate(id: string, name: string, spaceNames: string[]): ProjectGraph {
  const spaces = Object.fromEntries(
    spaceNames.map((spaceName, index) => {
      const spaceId = `space-${index + 1}`;

      return [
        spaceId,
        {
          id: spaceId,
          name: spaceName
        }
      ];
    })
  );
  const connections = Object.fromEntries(
    spaceNames.slice(1).map((_, index) => {
      const fromSpaceId = `space-${index + 1}`;
      const toSpaceId = `space-${index + 2}`;
      const connectionId = `${fromSpaceId}-${toSpaceId}`;

      return [
        connectionId,
        {
          id: connectionId,
          fromSpaceId,
          toSpaceId
        }
      ];
    })
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id,
      name
    },
    startSpaceId: 'space-1',
    targetSpaceIds: [`space-${spaceNames.length}`],
    spaces,
    connections,
    gates: {},
    tokens: {},
    puzzles: {},
    beats: {}
  };
}

function loadProjectText(text: string): ProjectGraph {
  const result = parseProjectText(text);

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.project;
}

function withRulePreset(project: ProjectGraph, rulePresetId: string | undefined): ProjectGraph {
  if (rulePresetId === undefined || project.rulePresetId === rulePresetId) {
    return project;
  }

  return {
    ...project,
    rulePresetId
  };
}

function entityKey(entity: EntityRef): string {
  return `${entity.kind}:${entity.id}`;
}

function sameEntityRefs(left: EntityRef[], right: EntityRef[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightKeys = new Set(right.map(entityKey));
  return left.every((entity) => rightKeys.has(entityKey(entity)));
}

function nextDiagnosticExceptionId(project: ProjectGraph, ruleId: string): string {
  const existingIds = new Set(
    (project.diagnosticExceptions ?? []).map((exception) => exception.id)
  );
  const base = `exception-${sanitizeIdSegment(ruleId) || 'diagnostic'}`;
  let id = base;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${base}-${index}`;
    index += 1;
  }

  return id;
}

function nextReviewThreadId(project: ProjectGraph, target: EntityRef): string {
  const existingIds = new Set((project.reviewThreads ?? []).map((thread) => thread.id));
  const base = `review-${sanitizeIdSegment(`${target.kind}-${target.id}`) || 'entity'}`;
  let id = base;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${base}-${index}`;
    index += 1;
  }

  return id;
}

function nextReviewCommentId(project: ProjectGraph, threadId: string): string {
  const thread = (project.reviewThreads ?? []).find((item) => item.id === threadId);
  const existingIds = new Set(thread?.comments.map((comment) => comment.id) ?? []);
  const base = `${sanitizeIdSegment(threadId) || 'review'}-comment`;
  let id = base;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${base}-${index}`;
    index += 1;
  }

  return id;
}

const templates: TemplateDefinition[] = [
  {
    id: 'traditional-maze',
    name: 'Traditional Maze',
    category: 'Spatial',
    description: 'A simple spatial chain for testing reachability and target paths.',
    stats: '4 spaces / open route',
    load: () =>
      createLinearTemplate('traditional-maze', 'Traditional Maze', [
        'Entrance',
        'Split Hall',
        'Hidden Turn',
        'Exit'
      ])
  },
  {
    id: 'zelda',
    name: 'Zelda Mini Dungeon',
    category: 'Locks and keys',
    description: 'A compact dungeon sample with item gates and progression checks.',
    stats: 'sample project',
    path: 'packages/test-fixtures/samples/zelda-mini-dungeon.lcproj.json',
    load: () => loadProjectText(zeldaProjectText)
  },
  {
    id: 'horror',
    name: 'Horror Puzzle',
    category: 'Investigation',
    description: 'Knowledge and state gates in a horror clinic route.',
    stats: 'sample project',
    path: 'packages/test-fixtures/samples/horror-clinic.lcproj.json',
    load: () => loadProjectText(horrorClinicProjectText)
  },
  {
    id: 'narrative',
    name: 'Narrative Labyrinth',
    category: 'Knowledge',
    description: 'A narrative knowledge-lock sample for clue and fact progression.',
    stats: 'sample project',
    path: 'packages/test-fixtures/samples/narrative-knowledge-lock.lcproj.json',
    load: () => loadProjectText(narrativeProjectText)
  },
  {
    id: 'metroidvania',
    name: 'Metroidvania Loop',
    category: 'Ability',
    description: 'A generated scaffold for ability unlocks and backtracking loops.',
    stats: 'generated scaffold',
    load: () =>
      createLinearTemplate('metroidvania-loop', 'Metroidvania Loop', [
        'Landing Site',
        'Broken Lift',
        'Ability Shrine',
        'Upper Gallery',
        'Return Gate'
      ])
  },
  {
    id: 'escape-room',
    name: 'Escape Room',
    category: 'Puzzle',
    description: 'A room-by-room scaffold for staged clue collection and exits.',
    stats: 'generated scaffold',
    load: () =>
      createLinearTemplate('escape-room', 'Escape Room', [
        'Lobby',
        'Locked Study',
        'Cipher Wall',
        'Control Cabinet',
        'Exit Door'
      ])
  },
  {
    id: 'blank',
    name: 'Start Blank',
    category: 'Blank',
    description: 'Begin with a single start node and build the graph by hand.',
    stats: '1 space',
    load: createStarterProject
  }
];

function createRecentProjectViewModels(preferences: DesktopPreferences): RecentProjectViewModel[] {
  return preferences.recentProjects.map((project) => ({
    path: project.path,
    label: project.label,
    lastOpenedAt: project.lastOpenedAt
  }));
}

export function App() {
  const store = useMemo(
    () =>
      createWorkbenchStore(createStarterProject(), {
        validationMode: 'deferred'
      }),
    []
  );
  const adapters = useMemo(() => createDesktopAdapters(), []);
  const [snapshot, setSnapshot] = useState(() => store.getSnapshot());
  const [showDashboard, setShowDashboard] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<EntityRef | null>({
    kind: 'space',
    id: 'start'
  });
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | undefined>();
  const [operationMessage, setOperationMessage] = useState('Ready');
  const [dashboardRulePresetId, setDashboardRulePresetId] = useState<string | undefined>();
  const [recentProjects, setRecentProjects] = useState<RecentProjectViewModel[]>([]);
  const validationWorkerRef = useRef<Worker | null>(null);
  const validationRequestIdRef = useRef(0);
  const latestValidationRequestIdRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('./workers/validationWorker.ts', import.meta.url), {
      type: 'module'
    });

    validationWorkerRef.current = worker;
    worker.onmessage = (event: MessageEvent<ValidationWorkerResponse>) => {
      if (event.data.requestId !== latestValidationRequestIdRef.current) {
        return;
      }

      setSnapshot(store.applyValidation(event.data.composition));
      setOperationMessage(`Validated in ${Math.max(1, Math.round(event.data.elapsedMs))} ms`);
    };
    worker.onerror = () => {
      setOperationMessage('Validation worker failed');
    };

    return () => {
      worker.terminate();

      if (validationWorkerRef.current === worker) {
        validationWorkerRef.current = null;
      }
    };
  }, [store]);

  useEffect(() => {
    let cancelled = false;

    void adapters.preferencesRepository.loadPreferences().then((result) => {
      if (cancelled) {
        return;
      }

      setRecentProjects(createRecentProjectViewModels(result.preferences));

      if (!result.ok) {
        setOperationMessage(result.message);
      } else if (result.recovered && result.message !== undefined) {
        setOperationMessage(result.message);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [adapters]);

  function scheduleValidation(project: ProjectGraph) {
    const requestId = validationRequestIdRef.current + 1;

    validationRequestIdRef.current = requestId;
    latestValidationRequestIdRef.current = requestId;

    const request = {
      requestId,
      project
    } satisfies ValidationWorkerRequest;

    if (validationWorkerRef.current === null) {
      setSnapshot(store.applyValidation(createValidationComposition(project)));
      setOperationMessage('Validated');
      return;
    }

    validationWorkerRef.current.postMessage(request);
  }

  function commit(nextSnapshot = store.getSnapshot(), message = 'Edited') {
    setSnapshot(nextSnapshot);
    setSelectedDiagnosticId(null);
    setOperationMessage(message);

    if (nextSnapshot.status === 'validating') {
      scheduleValidation(nextSnapshot.project);
    }
  }

  function selectEntity(entity: EntityRef | null) {
    setSelectedEntity(entity);
    setSelectedDiagnosticId(null);
  }

  function selectDiagnostic(id: string) {
    const diagnostic = snapshot.validation.diagnostics.find((item) => item.id === id);

    setSelectedDiagnosticId(id);

    const focusEntity = createHighlightedEntitiesForDiagnostic(diagnostic)[0];

    if (focusEntity !== undefined) {
      setSelectedEntity(focusEntity);
    }
  }

  async function rememberProjectPath(path: string | undefined, action: string) {
    if (path === undefined) {
      return;
    }

    const result = await adapters.preferencesRepository.addRecentProject(path);

    if (result.ok) {
      setRecentProjects(createRecentProjectViewModels(result.preferences));
    } else {
      setOperationMessage(result.message);
    }

    void adapters.preferencesRepository.appendLog(`${action}: ${path}`);
  }

  async function openProject() {
    const result = await adapters.projectRepository.openProject();

    if (!result.ok) {
      setOperationMessage(result.message);
      return;
    }

    const nextSnapshot = store.loadProject(result.project);

    setSnapshot(nextSnapshot);
    setSelectedEntity({ kind: 'space', id: result.project.startSpaceId });
    setSelectedDiagnosticId(null);
    setProjectPath(result.path);
    setDashboardRulePresetId(result.project.rulePresetId);
    setOperationMessage(`Loaded ${result.path ?? result.project.project.name}`);
    setShowDashboard(false);
    scheduleValidation(nextSnapshot.project);
    void rememberProjectPath(result.path, 'Opened project');
  }

  function selectDashboardRulePreset(rulePresetId: string) {
    setDashboardRulePresetId(rulePresetId);
    commit(
      store.dispatch({
        type: 'SetRulePreset',
        payload: {
          rulePresetId
        }
      }),
      'Selected rule preset'
    );
  }

  function loadTemplate(id: string) {
    const template = templates.find((item) => item.id === id);

    if (template === undefined) {
      setOperationMessage(`Unknown template ${id}`);
      return;
    }

    try {
      const project = withRulePreset(template.load(), dashboardRulePresetId);
      const nextSnapshot = store.loadProject(project);

      setSnapshot(nextSnapshot);
      setSelectedEntity({ kind: 'space', id: project.startSpaceId });
      setSelectedDiagnosticId(null);
      setProjectPath(template.path);
      setOperationMessage(`Loaded ${template.name}`);
      setShowDashboard(false);
      scheduleValidation(nextSnapshot.project);
    } catch (error) {
      setOperationMessage(`Template load failed: ${String(error)}`);
    }
  }

  function setRulePreset(rulePresetId: string) {
    setDashboardRulePresetId(rulePresetId);
    commit(
      store.dispatch({
        type: 'SetRulePreset',
        payload: {
          rulePresetId
        }
      }),
      'Rule preset updated'
    );
  }

  function updateRuleThreshold(ruleId: string, key: string, value: number) {
    if (!Number.isFinite(value)) {
      return;
    }

    const existing = snapshot.project.ruleOverrides?.find((override) => override.ruleId === ruleId);

    commit(
      store.dispatch({
        type: 'UpdateRuleOverride',
        payload: {
          override: {
            ...existing,
            ruleId,
            thresholdOverrides: {
              ...(existing?.thresholdOverrides ?? {}),
              [key]: value
            }
          }
        }
      }),
      'Rule threshold updated'
    );
  }

  function markDiagnosticException(id: string) {
    const diagnostic = snapshot.validation.diagnostics.find((item) => item.id === id);

    if (diagnostic === undefined) {
      setOperationMessage(`Diagnostic ${id} was not found`);
      return;
    }

    const alreadyExists = (snapshot.project.diagnosticExceptions ?? []).some(
      (exception) =>
        exception.ruleId === diagnostic.ruleId &&
        sameEntityRefs(exception.entityRefs, diagnostic.affectedEntities)
    );

    if (alreadyExists) {
      setOperationMessage('Diagnostic exception already exists');
      return;
    }

    commit(
      store.dispatch({
        type: 'AddDiagnosticException',
        payload: {
          exception: {
            id: nextDiagnosticExceptionId(snapshot.project, diagnostic.ruleId),
            ruleId: diagnostic.ruleId,
            entityRefs: diagnostic.affectedEntities,
            reason: 'Accepted from the diagnostics panel.'
          }
        }
      }),
      'Diagnostic exception added'
    );
  }

  function addReviewThread(target: EntityRef) {
    commit(
      store.dispatch({
        type: 'AddReviewThread',
        payload: {
          thread: {
            id: nextReviewThreadId(snapshot.project, target),
            target,
            status: 'open',
            comments: []
          }
        }
      }),
      'Review thread added'
    );
  }

  function updateReviewThreadStatus(id: string, status: ReviewThreadStatus) {
    commit(
      store.dispatch({
        type: 'UpdateReviewThreadStatus',
        payload: {
          id,
          status
        }
      }),
      status === 'resolved' ? 'Review thread resolved' : 'Review thread reopened'
    );
  }

  function addReviewComment(threadId: string, body: string) {
    const trimmedBody = body.trim();

    if (trimmedBody.length === 0) {
      return;
    }

    commit(
      store.dispatch({
        type: 'AddReviewComment',
        payload: {
          threadId,
          comment: {
            id: nextReviewCommentId(snapshot.project, threadId),
            body: trimmedBody,
            createdAt: new Date().toISOString()
          }
        }
      }),
      'Review comment added'
    );
  }

  function removeReviewComment(threadId: string, commentId: string) {
    commit(
      store.dispatch({
        type: 'RemoveReviewComment',
        payload: {
          threadId,
          commentId
        }
      }),
      'Review comment removed'
    );
  }

  async function saveProject() {
    const result = await adapters.projectRepository.saveProject(
      snapshot.project,
      projectPath === undefined
        ? undefined
        : {
            path: projectPath
          }
    );

    if (!result.ok) {
      setOperationMessage(result.message);
      return;
    }

    setSnapshot(store.markSaved());
    setProjectPath(result.path ?? projectPath);
    setOperationMessage(`Saved ${result.path ?? 'project'}`);
    void rememberProjectPath(result.path ?? projectPath, 'Saved project');
  }

  async function saveProjectAs() {
    const result = await adapters.projectRepository.saveProjectAs(snapshot.project);

    if (!result.ok) {
      setOperationMessage(result.message);
      return;
    }

    setSnapshot(store.markSaved());
    setProjectPath(result.path ?? projectPath);
    setOperationMessage(`Saved ${result.path ?? 'project copy'}`);
    void rememberProjectPath(result.path ?? projectPath, 'Saved project copy');
  }

  async function exportReport(format: ReportFormat) {
    const result = await adapters.reportRepository.saveReportAs(
      createReportText(snapshot, format),
      format
    );

    if (!result.ok) {
      setOperationMessage(result.message);
      return;
    }

    setOperationMessage(`Exported ${result.path ?? `${format} report`}`);
  }

  async function exportEngineJson() {
    const result = await adapters.engineExportRepository.saveEngineExportAs(
      createEngineExportText(snapshot)
    );

    if (!result.ok) {
      setOperationMessage(result.message);
      return;
    }

    setOperationMessage(`Exported ${result.path ?? 'engine export'}`);
  }

  function nextId(prefix: string, record: Record<string, unknown>) {
    let index = Object.keys(record).length + 1;
    let id = `${prefix}-${index}`;

    while (id in record) {
      index += 1;
      id = `${prefix}-${index}`;
    }

    return id;
  }

  function createSpace() {
    const id = nextId('space', snapshot.project.spaces);
    commit(
      store.dispatch({
        type: 'CreateSpace',
        payload: {
          space: {
            id,
            name: `Space ${Object.keys(snapshot.project.spaces).length + 1}`
          }
        }
      })
    );
    setSelectedEntity({ kind: 'space', id });
  }

  function createConnection() {
    const spaceIds = Object.keys(snapshot.project.spaces);

    if (spaceIds.length < 2) {
      return;
    }

    const fromSpaceId =
      selectedEntity?.kind === 'space' && spaceIds.includes(selectedEntity.id)
        ? selectedEntity.id
        : spaceIds[0];
    const toSpaceId = spaceIds.find((spaceId) => spaceId !== fromSpaceId);

    if (fromSpaceId === undefined || toSpaceId === undefined) {
      return;
    }

    const id = `${fromSpaceId}-${toSpaceId}`;

    if (id in snapshot.project.connections) {
      return;
    }

    commit(
      store.dispatch({
        type: 'ConnectSpaces',
        payload: {
          connection: {
            id,
            fromSpaceId,
            toSpaceId
          }
        }
      })
    );
    setSelectedEntity({ kind: 'connection', id });
  }

  function createGate() {
    const id = nextId('gate', snapshot.project.gates);
    commit(
      store.dispatch({
        type: 'CreateGate',
        payload: {
          gate: {
            id,
            name: `Gate ${Object.keys(snapshot.project.gates).length + 1}`,
            kind: 'lock',
            requiredTokenIds: []
          }
        }
      })
    );
    setSelectedEntity({ kind: 'gate', id });
  }

  function createToken() {
    const id = nextId('token', snapshot.project.tokens);
    commit(
      store.dispatch({
        type: 'CreateToken',
        payload: {
          token: {
            id,
            name: `Token ${Object.keys(snapshot.project.tokens).length + 1}`,
            kind: 'item',
            locationSpaceId:
              selectedEntity?.kind === 'space' ? selectedEntity.id : snapshot.project.startSpaceId
          }
        }
      })
    );
    setSelectedEntity({ kind: 'token', id });
  }

  function createPuzzle() {
    const tokenId = Object.keys(snapshot.project.tokens)[0] ?? 'token-1';
    let nextSnapshot = snapshot;

    if (!(tokenId in snapshot.project.tokens)) {
      nextSnapshot = store.dispatch({
        type: 'CreateToken',
        payload: {
          token: {
            id: tokenId,
            name: 'Token 1',
            kind: 'item',
            locationSpaceId: snapshot.project.startSpaceId
          }
        }
      });
    }

    const id = nextId('puzzle', nextSnapshot.project.puzzles);
    commit(
      store.dispatch({
        type: 'CreatePuzzle',
        payload: {
          puzzle: {
            id,
            name: `Puzzle ${Object.keys(nextSnapshot.project.puzzles).length + 1}`,
            locationSpaceId:
              selectedEntity?.kind === 'space'
                ? selectedEntity.id
                : nextSnapshot.project.startSpaceId,
            requiredTokenIds: [tokenId],
            outputTokenIds: [tokenId]
          }
        }
      })
    );
    setSelectedEntity({ kind: 'puzzle', id });
  }

  function createBeat() {
    const id = nextId('beat', snapshot.project.beats);
    const spaceId =
      selectedEntity?.kind === 'space' ? selectedEntity.id : snapshot.project.startSpaceId;

    commit(
      store.dispatch({
        type: 'UpdateBeat',
        payload: {
          beat: {
            id,
            name: `Beat ${Object.keys(snapshot.project.beats).length + 1}`,
            spaceId,
            intensity: 0.5
          }
        }
      })
    );
    setSelectedEntity({ kind: 'beat', id });
  }

  function updateSpace(id: string, patch: Partial<ProjectGraph['spaces'][string]>) {
    commit(
      store.dispatch({
        type: 'UpdateSpace',
        payload: {
          id,
          patch
        }
      })
    );
  }

  function updateConnection(id: string, patch: Partial<ProjectGraph['connections'][string]>) {
    commit(
      store.dispatch({
        type: 'UpdateConnection',
        payload: {
          id,
          patch
        }
      })
    );
  }

  function updateGate(id: string, patch: Partial<ProjectGraph['gates'][string]>) {
    commit(
      store.dispatch({
        type: 'UpdateGate',
        payload: {
          id,
          patch
        }
      })
    );
  }

  function updateToken(id: string, patch: Partial<ProjectGraph['tokens'][string]>) {
    commit(
      store.dispatch({
        type: 'UpdateToken',
        payload: {
          id,
          patch
        }
      })
    );
  }

  function updatePuzzle(id: string, patch: Partial<ProjectGraph['puzzles'][string]>) {
    commit(
      store.dispatch({
        type: 'UpdatePuzzle',
        payload: {
          id,
          patch
        }
      })
    );
  }

  function updateBeat(id: string, patch: Partial<ProjectGraph['beats'][string]>) {
    const beat = snapshot.project.beats[id];

    if (beat === undefined) {
      return;
    }

    commit(
      store.dispatch({
        type: 'UpdateBeat',
        payload: {
          beat: {
            ...beat,
            ...patch,
            id,
            name: patch.name ?? beat.name
          }
        }
      })
    );
  }

  return (
    <AppShell
      canRedo={store.commandBus.canRedo()}
      canUndo={store.commandBus.canUndo()}
      operationMessage={operationMessage}
      projectPath={projectPath}
      recentProjects={recentProjects}
      selectedDiagnosticId={selectedDiagnosticId}
      selectedEntity={selectedEntity}
      showDashboard={showDashboard}
      snapshot={snapshot}
      templates={templates}
      onCreateBeat={createBeat}
      onCreateConnection={createConnection}
      onCreateGate={createGate}
      onCreatePuzzle={createPuzzle}
      onCreateSpace={createSpace}
      onCreateToken={createToken}
      onExportReport={exportReport}
      onExportEngineJson={exportEngineJson}
      onAddReviewComment={addReviewComment}
      onAddReviewThread={addReviewThread}
      onOpenDashboard={() => setShowDashboard(true)}
      onOpenProject={openProject}
      onRedo={() => commit(store.redo())}
      onRunValidation={() => {
        commit(store.validate(), 'Validating');
      }}
      onSaveAsProject={saveProjectAs}
      onSaveProject={saveProject}
      onSelectDashboardRulePreset={selectDashboardRulePreset}
      onSelectDiagnostic={selectDiagnostic}
      onSelectEntity={selectEntity}
      onSelectTemplate={loadTemplate}
      onSetRulePreset={setRulePreset}
      onUndo={() => commit(store.undo())}
      onMarkDiagnosticException={markDiagnosticException}
      onRemoveReviewComment={removeReviewComment}
      onUpdateReviewThreadStatus={updateReviewThreadStatus}
      onUpdateRuleThreshold={updateRuleThreshold}
      onUpdateBeat={updateBeat}
      onUpdateConnection={updateConnection}
      onUpdateGate={updateGate}
      onUpdatePuzzle={updatePuzzle}
      onUpdateSpace={updateSpace}
      onUpdateToken={updateToken}
    />
  );
}
