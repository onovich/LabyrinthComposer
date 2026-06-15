import type { ProjectGraph } from '@labyrinth/schema';

import {
  canRedo,
  canUndo,
  createCommandHistory,
  executeCommand,
  redoCommand,
  undoCommand,
  type CommandHistory
} from './commandHistory.js';
import type { Command } from './commandTypes.js';

export type CommandBus = {
  getHistory(): CommandHistory;
  getProject(): ProjectGraph;
  dispatch(command: Command): ProjectGraph;
  undo(): ProjectGraph;
  redo(): ProjectGraph;
  canUndo(): boolean;
  canRedo(): boolean;
};

export function createCommandBus(initialProject: ProjectGraph): CommandBus {
  let history = createCommandHistory(initialProject);

  return {
    getHistory() {
      return history;
    },
    getProject() {
      return history.project;
    },
    dispatch(command) {
      history = executeCommand(history, command);
      return history.project;
    },
    undo() {
      history = undoCommand(history);
      return history.project;
    },
    redo() {
      history = redoCommand(history);
      return history.project;
    },
    canUndo() {
      return canUndo(history);
    },
    canRedo() {
      return canRedo(history);
    }
  };
}
