import type {
  ConnectionId,
  EntityRef,
  ProjectGraph,
  SpaceId,
  ValidationResult
} from '@labyrinth/schema';

import { entityRefKey } from './diagnosticSelectors.js';

export type GraphValidationState = 'neutral' | 'reachable' | 'unreachable' | 'affected';

export type SpaceNodeViewModel = {
  id: SpaceId;
  entityRef: EntityRef;
  title: string;
  validationState: GraphValidationState;
  position: {
    x: number;
    y: number;
  };
};

export type ConnectionEdgeViewModel = {
  id: ConnectionId;
  entityRef: EntityRef;
  source: SpaceId;
  target: SpaceId;
  validationState: Extract<GraphValidationState, 'neutral' | 'affected'>;
  label?: string;
};

export type GraphViewModel = {
  nodes: SpaceNodeViewModel[];
  edges: ConnectionEdgeViewModel[];
};

export type GraphViewModelOptions = {
  validation?: ValidationResult;
  highlightedEntities?: EntityRef[];
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function getSpaceValidationState(
  id: SpaceId,
  validation: ValidationResult | undefined,
  highlightedEntityKeys: Set<string>
): GraphValidationState {
  if (highlightedEntityKeys.has(entityRefKey({ kind: 'space', id }))) {
    return 'affected';
  }

  if (validation === undefined) {
    return 'neutral';
  }

  return validation.reachableSpaces.includes(id) ? 'reachable' : 'unreachable';
}

export function createGraphViewModel(
  project: ProjectGraph,
  options: GraphViewModelOptions = {}
): GraphViewModel {
  const highlightedEntityKeys = new Set(
    (options.highlightedEntities ?? []).map((entity) => entityRefKey(entity))
  );

  return {
    nodes: sortedEntries(project.spaces).map(([id, space], index) => ({
      id,
      entityRef: {
        kind: 'space',
        id
      },
      title: space.name,
      validationState: getSpaceValidationState(id, options.validation, highlightedEntityKeys),
      position: {
        x: 80 + (index % 4) * 220,
        y: 80 + Math.floor(index / 4) * 150
      }
    })),
    edges: sortedEntries(project.connections).map(([id, connection]) => ({
      id,
      entityRef: {
        kind: 'connection',
        id
      },
      source: connection.fromSpaceId,
      target: connection.toSpaceId,
      validationState: highlightedEntityKeys.has(entityRefKey({ kind: 'connection', id }))
        ? 'affected'
        : 'neutral',
      label: connection.gateId
    }))
  };
}
