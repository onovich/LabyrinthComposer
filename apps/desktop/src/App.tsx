import { AppShell, type TemplateCardViewModel } from '@labyrinth/editor-ui';
import {
  createHighlightedEntitiesForDiagnostic,
  createWorkbenchStore,
  parseProjectText
} from '@labyrinth/workbench';
import { SCHEMA_VERSION, type EntityRef, type ProjectGraph } from '@labyrinth/schema';
import { useMemo, useState } from 'react';

import { createDesktopAdapters } from './bootstrap/createDesktopAdapters.js';
import horrorClinicProjectText from '../../../packages/test-fixtures/samples/horror-clinic.lcproj.json?raw';
import narrativeProjectText from '../../../packages/test-fixtures/samples/narrative-knowledge-lock.lcproj.json?raw';
import zeldaProjectText from '../../../packages/test-fixtures/samples/zelda-mini-dungeon.lcproj.json?raw';

type TemplateDefinition = TemplateCardViewModel & {
  load(): ProjectGraph;
  path?: string;
};

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

export function App() {
  const store = useMemo(() => createWorkbenchStore(createStarterProject()), []);
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

  function commit(nextSnapshot = store.getSnapshot()) {
    setSnapshot(nextSnapshot);
    setSelectedDiagnosticId(null);
    setOperationMessage('Edited');
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

  async function openSample() {
    const result = await adapters.projectRepository.openProject();

    if (!result.ok) {
      setOperationMessage(result.message);
      return;
    }

    setSnapshot(store.loadProject(result.project));
    setSelectedEntity({ kind: 'space', id: result.project.startSpaceId });
    setSelectedDiagnosticId(null);
    setProjectPath(result.path);
    setOperationMessage(`Loaded ${result.path ?? result.project.project.name}`);
    setShowDashboard(false);
  }

  function loadTemplate(id: string) {
    const template = templates.find((item) => item.id === id);

    if (template === undefined) {
      setOperationMessage(`Unknown template ${id}`);
      return;
    }

    try {
      const project = template.load();
      setSnapshot(store.loadProject(project));
      setSelectedEntity({ kind: 'space', id: project.startSpaceId });
      setSelectedDiagnosticId(null);
      setProjectPath(template.path);
      setOperationMessage(`Loaded ${template.name}`);
      setShowDashboard(false);
    } catch (error) {
      setOperationMessage(`Template load failed: ${String(error)}`);
    }
  }

  async function saveCopy() {
    const result = await adapters.projectRepository.saveProjectAs(snapshot.project);

    if (!result.ok) {
      setOperationMessage(result.message);
      return;
    }

    setSnapshot(store.markSaved());
    setProjectPath(result.path ?? projectPath);
    setOperationMessage(`Saved ${result.path ?? 'copy'}`);
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
      onOpenDashboard={() => setShowDashboard(true)}
      onOpenSample={openSample}
      onRedo={() => commit(store.redo())}
      onRunValidation={() => {
        setSnapshot(store.validate());
        setSelectedDiagnosticId(null);
        setOperationMessage('Validated');
      }}
      onSaveCopy={saveCopy}
      onSelectDiagnostic={selectDiagnostic}
      onSelectEntity={selectEntity}
      onSelectTemplate={loadTemplate}
      onUndo={() => commit(store.undo())}
      onUpdateBeat={updateBeat}
      onUpdateConnection={updateConnection}
      onUpdateGate={updateGate}
      onUpdatePuzzle={updatePuzzle}
      onUpdateSpace={updateSpace}
      onUpdateToken={updateToken}
    />
  );
}
