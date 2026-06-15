export const SCHEMA_VERSION = '0.1.0';

export type SchemaVersion = typeof SCHEMA_VERSION;

export type EntityKind = 'space' | 'connection' | 'gate' | 'token' | 'puzzle' | 'beat';

export type EntityRef = {
  kind: EntityKind;
  id: string;
};

export type ProjectMetadata = {
  id: string;
  name: string;
};

export type ProjectGraph = {
  schemaVersion: SchemaVersion;
  project: ProjectMetadata;
  startSpaceId: string;
  targetSpaceIds: string[];
  spaces: Record<string, { id: string; name: string }>;
  connections: Record<string, { id: string; fromSpaceId: string; toSpaceId: string }>;
  gates: Record<string, { id: string; name: string; requiredTokenIds: string[] }>;
  tokens: Record<string, { id: string; name: string; locationSpaceId?: string }>;
  puzzles: Record<string, { id: string; name: string; locationSpaceId: string }>;
  beats: Record<string, { id: string; name: string }>;
  rulePresetId?: string;
};

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export type CauseStep = {
  entity: EntityRef;
  message: string;
};

export type FixSuggestion = {
  kind: 'move_token' | 'add_connection' | 'remove_requirement' | 'add_hint' | 'mark_exception';
  message: string;
  targetEntities: EntityRef[];
};

export type Diagnostic = {
  id: string;
  ruleId: string;
  severity: DiagnosticSeverity;
  message: string;
  affectedEntities: EntityRef[];
  causeChain: CauseStep[];
  suggestions: FixSuggestion[];
};

export type ValidationTraceStep = {
  iteration: number;
  events: string[];
};

export type ValidationResult = {
  ok: boolean;
  reachableSpaces: string[];
  acquiredTokens: string[];
  openedGates: string[];
  solvedPuzzles: string[];
  diagnostics: Diagnostic[];
  trace: ValidationTraceStep[];
};

export function createEmptyProject(id = 'empty-project'): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id,
      name: 'Empty Project'
    },
    startSpaceId: 'start',
    targetSpaceIds: [],
    spaces: {},
    connections: {},
    gates: {},
    tokens: {},
    puzzles: {},
    beats: {}
  };
}
