import { validateProjectWithRules } from '@labyrinth/core';
import { getRulePreset } from '@labyrinth/rulesets';
import type { ProjectGraph, RulePreset, ValidationResult } from '@labyrinth/schema';

import { createCommandBus, type CommandBus } from '../commands/commandBus.js';
import type { Command } from '../commands/commandTypes.js';

export type WorkbenchStatus = 'idle' | 'validating';

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
  markSaved(): WorkbenchSnapshot;
};

function makeSnapshot(project: ProjectGraph, dirty: boolean): WorkbenchSnapshot {
  const rulePreset = getRulePreset(project.rulePresetId);

  return {
    project,
    rulePreset,
    validation: validateProjectWithRules(project, {
      preset: rulePreset,
      overrides: project.ruleOverrides,
      exceptions: project.diagnosticExceptions
    }),
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
    },
    markSaved() {
      return refresh(false);
    }
  };
}
