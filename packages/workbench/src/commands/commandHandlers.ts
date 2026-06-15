import type { Connection, ProjectGraph, Space } from '@labyrinth/schema';

import type { Command, CommandResult } from './commandTypes.js';

function cloneProject(project: ProjectGraph): ProjectGraph {
  return JSON.parse(JSON.stringify(project)) as ProjectGraph;
}

function requireSpace(project: ProjectGraph, id: string): Space {
  const space = project.spaces[id];

  if (space === undefined) {
    throw new Error(`Space "${id}" does not exist.`);
  }

  return space;
}

function requireConnection(project: ProjectGraph, id: string): Connection {
  const connection = project.connections[id];

  if (connection === undefined) {
    throw new Error(`Connection "${id}" does not exist.`);
  }

  return connection;
}

function assertSpaceDoesNotExist(project: ProjectGraph, id: string): void {
  if (id in project.spaces) {
    throw new Error(`Space "${id}" already exists.`);
  }
}

function assertConnectionDoesNotExist(project: ProjectGraph, id: string): void {
  if (id in project.connections) {
    throw new Error(`Connection "${id}" already exists.`);
  }
}

function applyCreateSpace(project: ProjectGraph, command: Extract<Command, { type: 'CreateSpace' }>) {
  const next = cloneProject(project);
  const { space, setAsStart, addToTargets } = command.payload;

  assertSpaceDoesNotExist(next, space.id);
  next.spaces[space.id] = { ...space };

  if (setAsStart === true) {
    next.startSpaceId = space.id;
  }

  if (addToTargets === true && !next.targetSpaceIds.includes(space.id)) {
    next.targetSpaceIds = [...next.targetSpaceIds, space.id].sort();
  }

  return next;
}

function applyUpdateSpace(project: ProjectGraph, command: Extract<Command, { type: 'UpdateSpace' }>) {
  const next = cloneProject(project);
  const existing = requireSpace(next, command.payload.id);

  next.spaces[command.payload.id] = {
    ...existing,
    ...command.payload.patch,
    id: existing.id
  };

  return next;
}

function applyConnectSpaces(project: ProjectGraph, command: Extract<Command, { type: 'ConnectSpaces' }>) {
  const next = cloneProject(project);
  const { connection } = command.payload;

  assertConnectionDoesNotExist(next, connection.id);
  requireSpace(next, connection.fromSpaceId);
  requireSpace(next, connection.toSpaceId);

  if (connection.gateId !== undefined && !(connection.gateId in next.gates)) {
    throw new Error(`Gate "${connection.gateId}" does not exist.`);
  }

  next.connections[connection.id] = { ...connection };
  return next;
}

function applyUpdateConnection(
  project: ProjectGraph,
  command: Extract<Command, { type: 'UpdateConnection' }>
) {
  const next = cloneProject(project);
  const existing = requireConnection(next, command.payload.id);

  if (command.payload.patch.gateId !== undefined && !(command.payload.patch.gateId in next.gates)) {
    throw new Error(`Gate "${command.payload.patch.gateId}" does not exist.`);
  }

  next.connections[command.payload.id] = {
    ...existing,
    ...command.payload.patch,
    id: existing.id,
    fromSpaceId: existing.fromSpaceId,
    toSpaceId: existing.toSpaceId
  };

  return next;
}

export function applyCommand(project: ProjectGraph, command: Command): CommandResult {
  switch (command.type) {
    case 'LoadProject':
      return {
        project: cloneProject(command.payload.project)
      };
    case 'CreateSpace':
      return {
        project: applyCreateSpace(project, command)
      };
    case 'UpdateSpace':
      return {
        project: applyUpdateSpace(project, command)
      };
    case 'ConnectSpaces':
      return {
        project: applyConnectSpaces(project, command)
      };
    case 'UpdateConnection':
      return {
        project: applyUpdateConnection(project, command)
      };
  }
}
