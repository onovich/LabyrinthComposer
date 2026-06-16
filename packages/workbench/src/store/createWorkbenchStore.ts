import type { ProjectGraph, RulePreset, ValidationResult } from '@labyrinth/schema';

import { createCommandBus, type CommandBus } from '../commands/commandBus.js';
import type { Command } from '../commands/commandTypes.js';
import {
  createValidationComposition,
  type ValidationComposition
} from '../services/validationService.js';

export type WorkbenchStatus = 'idle' | 'validating';
export type WorkbenchValidationMode = 'sync' | 'deferred';

export type WorkbenchStoreOptions = {
  validationMode?: WorkbenchValidationMode;
};

export type WorkbenchSnapshot = {
  project: ProjectGraph;
  rulePreset: RulePreset;
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
  markValidating(): WorkbenchSnapshot;
  applyValidation(composition: ValidationComposition): WorkbenchSnapshot;
  markSaved(): WorkbenchSnapshot;
};

function makeSnapshot(project: ProjectGraph, dirty: boolean): WorkbenchSnapshot {
  const validationComposition = createValidationComposition(project);

  return {
    project,
    rulePreset: validationComposition.rulePreset,
    validation: validationComposition.validation,
    status: 'idle',
    dirty
  };
}

export function createWorkbenchStore(
  initialProject: ProjectGraph,
  options: WorkbenchStoreOptions = {}
): WorkbenchStore {
  const commandBus = createCommandBus(initialProject);
  const validationMode = options.validationMode ?? 'sync';
  let snapshot = makeSnapshot(commandBus.getProject(), false);

  function refresh(dirty: boolean): WorkbenchSnapshot {
    if (validationMode === 'deferred') {
      snapshot = {
        ...snapshot,
        project: commandBus.getProject(),
        status: 'validating',
        dirty
      };
      return snapshot;
    }

    snapshot = makeSnapshot(commandBus.getProject(), dirty);
    return snapshot;
  }

  function markValidating(): WorkbenchSnapshot {
    snapshot = {
      ...snapshot,
      status: 'validating'
    };
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
    },
    markValidating,
    applyValidation(composition) {
      snapshot = {
        ...snapshot,
        rulePreset: composition.rulePreset,
        validation: composition.validation,
        status: 'idle'
      };
      return snapshot;
    },
    markSaved() {
      if (validationMode === 'deferred') {
        snapshot = {
          ...snapshot,
          project: commandBus.getProject(),
          dirty: false
        };
        return snapshot;
      }

      return refresh(false);
    }
  };
}
