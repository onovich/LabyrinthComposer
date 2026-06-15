import { AppShell } from '@labyrinth/editor-ui';
import { createWorkbenchStore } from '@labyrinth/workbench';
import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';
import { useMemo } from 'react';

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

  return <AppShell snapshot={store.getSnapshot()} />;
}
