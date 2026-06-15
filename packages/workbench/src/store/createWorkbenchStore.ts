import { validateProject } from '@labyrinth/core';
import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

import { createCommandBus, type CommandBus } from '../commands/commandBus.js';
import type { Command } from '../commands/commandTypes.js';

export type WorkbenchStatus = 'idle' | 'validating';

export type WorkbenchSnapshot = {
  project: ProjectGraph;
  validation: ValidationResult;
  status: WorkbenchStatus;
  dirty: boolean;
};

export type WorkbenchStore = {
  commandBus: CommandBus;
  getSnapshot(): WorkbenchSnapshot;
  loadProject(project: ProjectGraph): WorkbenchSnapshot;
  dispatch(command: Command): WorkbenchSnapshot;
  undo(): WorkbenchSnapshot;
  redo(): WorkbenchSnapshot;
  validate(): WorkbenchSnapshot;
};

function makeSnapshot(project: ProjectGraph, dirty: boolean): WorkbenchSnapshot {
  return {
    project,
    validation: validateProject(project),
    status: 'idle',
    dirty
  };
}

export function createWorkbenchStore(initialProject: ProjectGraph): WorkbenchStore {
  const commandBus = createCommandBus(initialProject);
  let snapshot = makeSnapshot(commandBus.getProject(), false);

  function refresh(dirty: boolean): WorkbenchSnapshot {
    snapshot = makeSnapshot(commandBus.getProject(), dirty);
    return snapshot;
  }

  return {
    commandBus,
    getSnapshot() {
      return snapshot;
    },
    loadProject(project) {
      commandBus.dispatch({
        type: 'LoadProject',
        payload: {
          project
        }
      });
      return refresh(false);
    },
    dispatch(command) {
      commandBus.dispatch(command);
      return refresh(true);
    },
    undo() {
      commandBus.undo();
      return refresh(true);
    },
    redo() {
      commandBus.redo();
      return refresh(true);
    },
    validate() {
      return refresh(snapshot.dirty);
    }
  };
}
