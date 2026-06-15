import type { ProjectGraph } from '@labyrinth/schema';

import { applyCommand } from './commandHandlers.js';
import type { Command } from './commandTypes.js';

type HistoryEntry = {
  command: Command;
  before: ProjectGraph;
  after: ProjectGraph;
};

export type CommandHistory = {
  project: ProjectGraph;
  past: HistoryEntry[];
  future: HistoryEntry[];
};

function cloneProject(project: ProjectGraph): ProjectGraph {
  return JSON.parse(JSON.stringify(project)) as ProjectGraph;
}

export function createCommandHistory(project: ProjectGraph): CommandHistory {
  return {
    project: cloneProject(project),
    past: [],
    future: []
  };
}

export function executeCommand(history: CommandHistory, command: Command): CommandHistory {
  const before = cloneProject(history.project);
  const { project } = applyCommand(history.project, command);

  return {
    project,
    past: [
      ...history.past,
      {
        command,
        before,
        after: cloneProject(project)
      }
    ],
    future: []
  };
}

export function undoCommand(history: CommandHistory): CommandHistory {
  const entry = history.past.at(-1);

  if (entry === undefined) {
    return history;
  }

  return {
    project: cloneProject(entry.before),
    past: history.past.slice(0, -1),
    future: [entry, ...history.future]
  };
}

export function redoCommand(history: CommandHistory): CommandHistory {
  const entry = history.future[0];

  if (entry === undefined) {
    return history;
  }

  return {
    project: cloneProject(entry.after),
    past: [...history.past, entry],
    future: history.future.slice(1)
  };
}

export function canUndo(history: CommandHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: CommandHistory): boolean {
  return history.future.length > 0;
}
