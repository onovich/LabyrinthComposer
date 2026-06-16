import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js';

import projectSchema from './jsonSchema/project.schema.json' with { type: 'json' };
import type {
  Beat,
  BeatId,
  Connection,
  ConnectionId,
  Gate,
  GateId,
  Puzzle,
  PuzzleId,
  RulePresetId,
  Space,
  SpaceId,
  Token,
  TokenId
} from './entities.js';
import type { DiagnosticException, RulePresetOverride } from './rulesets.js';
import { SCHEMA_VERSION, type SchemaVersion } from './schemaVersion.js';
import type { ReviewThread } from './review.js';
import type { AssetRef } from './assets.js';

export type ProjectMetadata = {
  id: string;
  name: string;
  description?: string;
  author?: string;
};

export type ProjectGraph = {
  schemaVersion: SchemaVersion;
  project: ProjectMetadata;
  startSpaceId: SpaceId;
  targetSpaceIds: SpaceId[];
  spaces: Record<SpaceId, Space>;
  connections: Record<ConnectionId, Connection>;
  gates: Record<GateId, Gate>;
  tokens: Record<TokenId, Token>;
  puzzles: Record<PuzzleId, Puzzle>;
  beats: Record<BeatId, Beat>;
  rulePresetId?: RulePresetId;
  ruleOverrides?: RulePresetOverride[];
  diagnosticExceptions?: DiagnosticException[];
  reviewThreads?: ReviewThread[];
  assets?: AssetRef[];
};

export type SchemaIssue = {
  path: string;
  message: string;
  keyword?: string;
};

export type ParseProjectResult =
  | {
      ok: true;
      project: ProjectGraph;
    }
  | {
      ok: false;
      issues: SchemaIssue[];
    };

export const projectJsonSchema = projectSchema;

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

const validateProjectGraphSchema = ajv.compile<ProjectGraph>(projectJsonSchema);

export function parseProjectGraph(value: unknown): ParseProjectResult {
  if (validateProjectGraphSchema(value)) {
    return {
      ok: true,
      project: value as ProjectGraph
    };
  }

  return {
    ok: false,
    issues: (validateProjectGraphSchema.errors ?? []).map((error: ErrorObject) => ({
      path:
        error.instancePath.length > 0
          ? error.instancePath
          : 'params' in error && 'missingProperty' in error.params
            ? `/${String(error.params.missingProperty)}`
            : '/',
      message: error.message ?? 'Schema validation failed.',
      keyword: error.keyword
    }))
  };
}

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
