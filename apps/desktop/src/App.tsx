import { AppShell } from '@labyrinth/editor-ui';
import { createEmptyWorkbenchSnapshot } from '@labyrinth/workbench';

export function App() {
  return <AppShell snapshot={createEmptyWorkbenchSnapshot()} />;
}
