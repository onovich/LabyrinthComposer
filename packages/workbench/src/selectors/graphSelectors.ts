import type {
  ConnectionId,
  EntityRef,
  EntityKind,
  ProjectGraph,
  SpaceId,
  ValidationResult
} from '@labyrinth/schema';

import { entityRefKey } from './diagnosticSelectors.js';

export type GraphValidationState = 'neutral' | 'reachable' | 'unreachable' | 'affected';

export type GraphNodeKind = 'space' | 'token' | 'puzzle';

export type GraphNodeViewModel = {
  id: string;
  entityRef: EntityRef;
  nodeKind: GraphNodeKind;
  title: string;
  subtitle?: string;
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
  gateId?: string;
  label?: string;
};

export type GraphViewModel = {
  nodes: GraphNodeViewModel[];
  edges: ConnectionEdgeViewModel[];
};

export type GraphViewModelOptions = {
  validation?: ValidationResult;
  highlightedEntities?: EntityRef[];
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function graphNodeId(kind: EntityKind, id: string): string {
  return kind === 'space' ? id : `${kind}:${id}`;
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

function getEntityValidationState(
  entity: EntityRef,
  highlightedEntityKeys: Set<string>
): GraphValidationState {
  return highlightedEntityKeys.has(entityRefKey(entity)) ? 'affected' : 'neutral';
}

function createSpacePositions(project: ProjectGraph): Map<SpaceId, { x: number; y: number }> {
  const positions = new Map<SpaceId, { x: number; y: number }>();
  const spaceIds = sortedEntries(project.spaces).map(([id]) => id);
  const connectedIds = new Set<SpaceId>([project.startSpaceId]);

  for (const connection of Object.values(project.connections)) {
    connectedIds.add(connection.fromSpaceId);
    connectedIds.add(connection.toSpaceId);
  }

  const orderedSpaceIds = [
    project.startSpaceId,
    ...spaceIds.filter((id) => id !== project.startSpaceId && connectedIds.has(id)),
    ...spaceIds.filter((id) => !connectedIds.has(id))
  ].filter((id, index, ids) => id in project.spaces && ids.indexOf(id) === index);

  orderedSpaceIds.forEach((id, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);

    positions.set(id, {
      x: 80 + column * 210,
      y: 80 + row * 180
    });
  });

  return positions;
}

export function createGraphViewModel(
  project: ProjectGraph,
  options: GraphViewModelOptions = {}
): GraphViewModel {
  const highlightedEntityKeys = new Set(
    (options.highlightedEntities ?? []).map((entity) => entityRefKey(entity))
  );
  const spacePositions = createSpacePositions(project);
  const unplacedTokenStartY =
    120 + Math.ceil(Math.max(1, Object.keys(project.spaces).length) / 3) * 180;
  const spaceNodes: GraphNodeViewModel[] = sortedEntries(project.spaces).map(([id, space]) => ({
    id: graphNodeId('space', id),
    entityRef: {
      kind: 'space',
      id
    },
    nodeKind: 'space',
    title: space.name,
    subtitle: id,
    validationState: getSpaceValidationState(id, options.validation, highlightedEntityKeys),
    position: spacePositions.get(id) ?? {
      x: 80,
      y: 80
    }
  }));
  const tokenNodes: GraphNodeViewModel[] = sortedEntries(project.tokens).map(
    ([id, token], index) => {
      const basePosition =
        token.locationSpaceId !== undefined ? spacePositions.get(token.locationSpaceId) : undefined;

      return {
        id: graphNodeId('token', id),
        entityRef: {
          kind: 'token',
          id
        },
        nodeKind: 'token',
        title: token.name,
        subtitle: token.kind,
        validationState: getEntityValidationState({ kind: 'token', id }, highlightedEntityKeys),
        position:
          basePosition !== undefined
            ? {
                x: basePosition.x + 22,
                y: basePosition.y + 82 + (index % 2) * 34
              }
            : {
                x: 80 + (index % 4) * 150,
                y: unplacedTokenStartY + Math.floor(index / 4) * 54
              }
      };
    }
  );
  const puzzleNodes: GraphNodeViewModel[] = sortedEntries(project.puzzles).map(
    ([id, puzzle], index) => {
      const basePosition = spacePositions.get(puzzle.locationSpaceId);

      return {
        id: graphNodeId('puzzle', id),
        entityRef: {
          kind: 'puzzle',
          id
        },
        nodeKind: 'puzzle',
        title: puzzle.name,
        subtitle:
          puzzle.requiredTokenIds.length > 0
            ? `${puzzle.requiredTokenIds.length} inputs -> ${puzzle.outputTokenIds.length} outputs`
            : `${puzzle.outputTokenIds.length} outputs`,
        validationState: getEntityValidationState({ kind: 'puzzle', id }, highlightedEntityKeys),
        position:
          basePosition !== undefined
            ? {
                x: basePosition.x + 24,
                y: basePosition.y + 124 + (index % 2) * 38
              }
            : {
                x: 80 + (index % 4) * 170,
                y: unplacedTokenStartY + 80 + Math.floor(index / 4) * 70
              }
      };
    }
  );

  return {
    nodes: [...spaceNodes, ...tokenNodes, ...puzzleNodes],
    edges: sortedEntries(project.connections).map(([id, connection]) => ({
      id,
      entityRef: {
        kind: 'connection',
        id
      },
      source: connection.fromSpaceId,
      target: connection.toSpaceId,
      validationState:
        highlightedEntityKeys.has(entityRefKey({ kind: 'connection', id })) ||
        (connection.gateId !== undefined &&
          highlightedEntityKeys.has(entityRefKey({ kind: 'gate', id: connection.gateId })))
          ? 'affected'
          : 'neutral',
      gateId: connection.gateId,
      label:
        connection.gateId !== undefined
          ? (project.gates[connection.gateId]?.name ?? connection.gateId)
          : undefined
    }))
  };
}
