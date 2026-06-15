import { AppShell } from '@labyrinth/editor-ui';
import { createWorkbenchStore } from '@labyrinth/workbench';
import { SCHEMA_VERSION, type EntityRef, type ProjectGraph } from '@labyrinth/schema';
import { useMemo, useState } from 'react';

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

export function App() {
  const store = useMemo(() => createWorkbenchStore(createStarterProject()), []);
  const [snapshot, setSnapshot] = useState(() => store.getSnapshot());
  const [selectedEntity, setSelectedEntity] = useState<EntityRef | null>({
    kind: 'space',
    id: 'start'
  });

  function commit(nextSnapshot = store.getSnapshot()) {
    setSnapshot(nextSnapshot);
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

  return (
    <AppShell
      canRedo={store.commandBus.canRedo()}
      canUndo={store.commandBus.canUndo()}
      selectedEntity={selectedEntity}
      snapshot={snapshot}
      onCreateConnection={createConnection}
      onCreateGate={createGate}
      onCreatePuzzle={createPuzzle}
      onCreateSpace={createSpace}
      onCreateToken={createToken}
      onRedo={() => commit(store.redo())}
      onSelectEntity={setSelectedEntity}
      onUndo={() => commit(store.undo())}
      onUpdateSpace={updateSpace}
    />
  );
}
