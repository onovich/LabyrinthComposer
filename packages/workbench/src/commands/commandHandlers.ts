import type { Beat, Connection, Gate, ProjectGraph, Puzzle, Space, Token } from '@labyrinth/schema';

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

function requireGate(project: ProjectGraph, id: string): Gate {
  const gate = project.gates[id];

  if (gate === undefined) {
    throw new Error(`Gate "${id}" does not exist.`);
  }

  return gate;
}

function requireToken(project: ProjectGraph, id: string): Token {
  const token = project.tokens[id];

  if (token === undefined) {
    throw new Error(`Token "${id}" does not exist.`);
  }

  return token;
}

function requirePuzzle(project: ProjectGraph, id: string): Puzzle {
  const puzzle = project.puzzles[id];

  if (puzzle === undefined) {
    throw new Error(`Puzzle "${id}" does not exist.`);
  }

  return puzzle;
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

function assertGateDoesNotExist(project: ProjectGraph, id: string): void {
  if (id in project.gates) {
    throw new Error(`Gate "${id}" already exists.`);
  }
}

function assertTokenDoesNotExist(project: ProjectGraph, id: string): void {
  if (id in project.tokens) {
    throw new Error(`Token "${id}" already exists.`);
  }
}

function assertPuzzleDoesNotExist(project: ProjectGraph, id: string): void {
  if (id in project.puzzles) {
    throw new Error(`Puzzle "${id}" already exists.`);
  }
}

function assertTokensExist(project: ProjectGraph, tokenIds: string[]): void {
  for (const tokenId of tokenIds) {
    requireToken(project, tokenId);
  }
}

function applyCreateSpace(
  project: ProjectGraph,
  command: Extract<Command, { type: 'CreateSpace' }>
) {
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

function applyUpdateSpace(
  project: ProjectGraph,
  command: Extract<Command, { type: 'UpdateSpace' }>
) {
  const next = cloneProject(project);
  const existing = requireSpace(next, command.payload.id);

  next.spaces[command.payload.id] = {
    ...existing,
    ...command.payload.patch,
    id: existing.id
  };

  return next;
}

function applyConnectSpaces(
  project: ProjectGraph,
  command: Extract<Command, { type: 'ConnectSpaces' }>
) {
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

function applyCreateGate(project: ProjectGraph, command: Extract<Command, { type: 'CreateGate' }>) {
  const next = cloneProject(project);
  const { gate } = command.payload;

  assertGateDoesNotExist(next, gate.id);
  assertTokensExist(next, gate.requiredTokenIds);
  next.gates[gate.id] = { ...gate };
  return next;
}

function applyUpdateGate(project: ProjectGraph, command: Extract<Command, { type: 'UpdateGate' }>) {
  const next = cloneProject(project);
  const existing = requireGate(next, command.payload.id);

  if (command.payload.patch.requiredTokenIds !== undefined) {
    assertTokensExist(next, command.payload.patch.requiredTokenIds);
  }

  next.gates[command.payload.id] = {
    ...existing,
    ...command.payload.patch,
    id: existing.id
  };

  return next;
}

function applyCreateToken(
  project: ProjectGraph,
  command: Extract<Command, { type: 'CreateToken' }>
) {
  const next = cloneProject(project);
  const { token } = command.payload;

  assertTokenDoesNotExist(next, token.id);

  if (token.locationSpaceId !== undefined) {
    requireSpace(next, token.locationSpaceId);
  }

  next.tokens[token.id] = { ...token };
  return next;
}

function applyUpdateToken(
  project: ProjectGraph,
  command: Extract<Command, { type: 'UpdateToken' }>
) {
  const next = cloneProject(project);
  const existing = requireToken(next, command.payload.id);

  if (command.payload.patch.locationSpaceId !== undefined) {
    requireSpace(next, command.payload.patch.locationSpaceId);
  }

  next.tokens[command.payload.id] = {
    ...existing,
    ...command.payload.patch,
    id: existing.id
  };

  return next;
}

function applyMoveToken(project: ProjectGraph, command: Extract<Command, { type: 'MoveToken' }>) {
  return applyUpdateToken(project, {
    type: 'UpdateToken',
    payload: {
      id: command.payload.id,
      patch: {
        locationSpaceId: command.payload.locationSpaceId
      }
    }
  });
}

function applyCreatePuzzle(
  project: ProjectGraph,
  command: Extract<Command, { type: 'CreatePuzzle' }>
) {
  const next = cloneProject(project);
  const { puzzle } = command.payload;

  assertPuzzleDoesNotExist(next, puzzle.id);
  requireSpace(next, puzzle.locationSpaceId);
  assertTokensExist(next, puzzle.requiredTokenIds);
  assertTokensExist(next, puzzle.outputTokenIds);
  next.puzzles[puzzle.id] = { ...puzzle };
  return next;
}

function applyUpdatePuzzle(
  project: ProjectGraph,
  command: Extract<Command, { type: 'UpdatePuzzle' }>
) {
  const next = cloneProject(project);
  const existing = requirePuzzle(next, command.payload.id);

  if (command.payload.patch.locationSpaceId !== undefined) {
    requireSpace(next, command.payload.patch.locationSpaceId);
  }

  if (command.payload.patch.requiredTokenIds !== undefined) {
    assertTokensExist(next, command.payload.patch.requiredTokenIds);
  }

  if (command.payload.patch.outputTokenIds !== undefined) {
    assertTokensExist(next, command.payload.patch.outputTokenIds);
  }

  next.puzzles[command.payload.id] = {
    ...existing,
    ...command.payload.patch,
    id: existing.id
  };

  return next;
}

function applyUpdateBeat(project: ProjectGraph, command: Extract<Command, { type: 'UpdateBeat' }>) {
  const next = cloneProject(project);
  const beat: Beat = { ...command.payload.beat };

  if (beat.spaceId !== undefined) {
    requireSpace(next, beat.spaceId);
  }

  next.beats[beat.id] = beat;
  return next;
}

function applyReorderBeat(
  project: ProjectGraph,
  command: Extract<Command, { type: 'ReorderBeat' }>
) {
  const next = cloneProject(project);
  const existing = next.beats[command.payload.id];

  if (existing === undefined) {
    throw new Error(`Beat "${command.payload.id}" does not exist.`);
  }

  next.beats[command.payload.id] = {
    ...existing,
    order: command.payload.order
  };

  return next;
}

function applySetRulePreset(
  project: ProjectGraph,
  command: Extract<Command, { type: 'SetRulePreset' }>
) {
  const next = cloneProject(project);

  next.rulePresetId = command.payload.rulePresetId;
  return next;
}

function applyUpdateRuleOverride(
  project: ProjectGraph,
  command: Extract<Command, { type: 'UpdateRuleOverride' }>
) {
  const next = cloneProject(project);
  const overrides = next.ruleOverrides ?? [];

  next.ruleOverrides = [
    ...overrides.filter((override) => override.ruleId !== command.payload.override.ruleId),
    { ...command.payload.override }
  ].sort((left, right) => left.ruleId.localeCompare(right.ruleId));

  return next;
}

function applyRemoveRuleOverride(
  project: ProjectGraph,
  command: Extract<Command, { type: 'RemoveRuleOverride' }>
) {
  const next = cloneProject(project);
  const overrides = (next.ruleOverrides ?? []).filter(
    (override) => override.ruleId !== command.payload.ruleId
  );

  if (overrides.length === 0) {
    delete next.ruleOverrides;
  } else {
    next.ruleOverrides = overrides;
  }

  return next;
}

function applyAddDiagnosticException(
  project: ProjectGraph,
  command: Extract<Command, { type: 'AddDiagnosticException' }>
) {
  const next = cloneProject(project);
  const exceptions = next.diagnosticExceptions ?? [];

  next.diagnosticExceptions = [
    ...exceptions.filter((exception) => exception.id !== command.payload.exception.id),
    { ...command.payload.exception }
  ].sort((left, right) => left.id.localeCompare(right.id));

  return next;
}

function applyRemoveDiagnosticException(
  project: ProjectGraph,
  command: Extract<Command, { type: 'RemoveDiagnosticException' }>
) {
  const next = cloneProject(project);
  const exceptions = (next.diagnosticExceptions ?? []).filter(
    (exception) => exception.id !== command.payload.id
  );

  if (exceptions.length === 0) {
    delete next.diagnosticExceptions;
  } else {
    next.diagnosticExceptions = exceptions;
  }

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
    case 'CreateGate':
      return {
        project: applyCreateGate(project, command)
      };
    case 'UpdateGate':
      return {
        project: applyUpdateGate(project, command)
      };
    case 'CreateToken':
      return {
        project: applyCreateToken(project, command)
      };
    case 'UpdateToken':
      return {
        project: applyUpdateToken(project, command)
      };
    case 'MoveToken':
      return {
        project: applyMoveToken(project, command)
      };
    case 'CreatePuzzle':
      return {
        project: applyCreatePuzzle(project, command)
      };
    case 'UpdatePuzzle':
      return {
        project: applyUpdatePuzzle(project, command)
      };
    case 'UpdateBeat':
      return {
        project: applyUpdateBeat(project, command)
      };
    case 'ReorderBeat':
      return {
        project: applyReorderBeat(project, command)
      };
    case 'SetRulePreset':
      return {
        project: applySetRulePreset(project, command)
      };
    case 'UpdateRuleOverride':
      return {
        project: applyUpdateRuleOverride(project, command)
      };
    case 'RemoveRuleOverride':
      return {
        project: applyRemoveRuleOverride(project, command)
      };
    case 'AddDiagnosticException':
      return {
        project: applyAddDiagnosticException(project, command)
      };
    case 'RemoveDiagnosticException':
      return {
        project: applyRemoveDiagnosticException(project, command)
      };
  }
}
