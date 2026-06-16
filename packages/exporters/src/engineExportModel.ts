import type {
  Beat,
  Connection,
  Diagnostic,
  Gate,
  ProjectGraph,
  Puzzle,
  RulePreset,
  Space,
  Token,
  ValidationResult
} from '@labyrinth/schema';

export type EngineExportVersion = '0.1.0';

export type EngineDiagnostic = Pick<
  Diagnostic,
  'id' | 'ruleId' | 'severity' | 'message' | 'affectedEntities' | 'suggestions'
> & {
  suppressed: boolean;
  exceptionId?: string;
};

export type EngineSpace = Pick<Space, 'id' | 'name' | 'description' | 'tags'>;
export type EngineConnection = Pick<
  Connection,
  'id' | 'fromSpaceId' | 'toSpaceId' | 'directed' | 'gateId' | 'description'
>;
export type EngineGate = Pick<Gate, 'id' | 'name' | 'kind' | 'requiredTokenIds' | 'description'>;
export type EngineToken = Pick<Token, 'id' | 'name' | 'kind' | 'locationSpaceId' | 'description'>;
export type EnginePuzzle = Pick<
  Puzzle,
  'id' | 'name' | 'locationSpaceId' | 'requiredTokenIds' | 'outputTokenIds' | 'description'
>;
export type EngineBeat = Pick<
  Beat,
  'id' | 'name' | 'spaceId' | 'kind' | 'intensity' | 'order' | 'description'
>;

export type EngineExport = {
  exportVersion: EngineExportVersion;
  generatedAt: string;
  sourceProject: {
    id: string;
    name: string;
    schemaVersion: string;
    rulePresetId?: string;
    rulePresetName: string;
  };
  validation: {
    ok: boolean;
    reachableSpaces: string[];
    acquiredTokens: string[];
    openedGates: string[];
    solvedPuzzles: string[];
    diagnostics: EngineDiagnostic[];
  };
  spaces: EngineSpace[];
  connections: EngineConnection[];
  gates: EngineGate[];
  tokens: EngineToken[];
  puzzles: EnginePuzzle[];
  beats: EngineBeat[];
};

function sortedValues<T extends { id: string }>(record: Record<string, T>): T[] {
  return Object.values(record).sort((left, right) => left.id.localeCompare(right.id));
}

function sortedIds(ids: string[]): string[] {
  return [...ids].sort();
}

function mapSpace(space: Space): EngineSpace {
  return {
    id: space.id,
    name: space.name,
    description: space.description,
    tags: space.tags === undefined ? undefined : sortedIds(space.tags)
  };
}

function mapConnection(connection: Connection): EngineConnection {
  return {
    id: connection.id,
    fromSpaceId: connection.fromSpaceId,
    toSpaceId: connection.toSpaceId,
    directed: connection.directed,
    gateId: connection.gateId,
    description: connection.description
  };
}

function mapGate(gate: Gate): EngineGate {
  return {
    id: gate.id,
    name: gate.name,
    kind: gate.kind,
    requiredTokenIds: sortedIds(gate.requiredTokenIds),
    description: gate.description
  };
}

function mapToken(token: Token): EngineToken {
  return {
    id: token.id,
    name: token.name,
    kind: token.kind,
    locationSpaceId: token.locationSpaceId,
    description: token.description
  };
}

function mapPuzzle(puzzle: Puzzle): EnginePuzzle {
  return {
    id: puzzle.id,
    name: puzzle.name,
    locationSpaceId: puzzle.locationSpaceId,
    requiredTokenIds: sortedIds(puzzle.requiredTokenIds),
    outputTokenIds: sortedIds(puzzle.outputTokenIds),
    description: puzzle.description
  };
}

function mapBeat(beat: Beat): EngineBeat {
  return {
    id: beat.id,
    name: beat.name,
    spaceId: beat.spaceId,
    kind: beat.kind,
    intensity: beat.intensity,
    order: beat.order,
    description: beat.description
  };
}

function mapDiagnostic(diagnostic: Diagnostic): EngineDiagnostic {
  return {
    id: diagnostic.id,
    ruleId: diagnostic.ruleId,
    severity: diagnostic.severity,
    message: diagnostic.message,
    affectedEntities: [...diagnostic.affectedEntities].sort((left, right) =>
      `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`)
    ),
    suggestions: [...diagnostic.suggestions].sort((left, right) =>
      `${left.kind}:${left.message}`.localeCompare(`${right.kind}:${right.message}`)
    ),
    suppressed: diagnostic.suppressed === true,
    exceptionId: diagnostic.exceptionId
  };
}

export function createEngineExport(
  project: ProjectGraph,
  validation: ValidationResult,
  rulePreset: RulePreset,
  generatedAt = new Date().toISOString()
): EngineExport {
  return {
    exportVersion: '0.1.0',
    generatedAt,
    sourceProject: {
      id: project.project.id,
      name: project.project.name,
      schemaVersion: project.schemaVersion,
      rulePresetId: project.rulePresetId,
      rulePresetName: rulePreset.name
    },
    validation: {
      ok: validation.ok,
      reachableSpaces: sortedIds(validation.reachableSpaces),
      acquiredTokens: sortedIds(validation.acquiredTokens),
      openedGates: sortedIds(validation.openedGates),
      solvedPuzzles: sortedIds(validation.solvedPuzzles),
      diagnostics: validation.diagnostics
        .map((diagnostic) => mapDiagnostic(diagnostic))
        .sort((left, right) => left.id.localeCompare(right.id))
    },
    spaces: sortedValues(project.spaces).map((space) => mapSpace(space)),
    connections: sortedValues(project.connections).map((connection) => mapConnection(connection)),
    gates: sortedValues(project.gates).map((gate) => mapGate(gate)),
    tokens: sortedValues(project.tokens).map((token) => mapToken(token)),
    puzzles: sortedValues(project.puzzles).map((puzzle) => mapPuzzle(puzzle)),
    beats: Object.values(project.beats)
      .map((beat) => mapBeat(beat))
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id))
  };
}
