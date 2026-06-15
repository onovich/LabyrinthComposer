import type { ConnectionId, EntityRef, ProjectGraph, SpaceId } from '@labyrinth/schema';

export type SpaceNodeViewModel = {
  id: SpaceId;
  entityRef: EntityRef;
  title: string;
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
  label?: string;
};

export type GraphViewModel = {
  nodes: SpaceNodeViewModel[];
  edges: ConnectionEdgeViewModel[];
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

export function createGraphViewModel(project: ProjectGraph): GraphViewModel {
  return {
    nodes: sortedEntries(project.spaces).map(([id, space], index) => ({
      id,
      entityRef: {
        kind: 'space',
        id
      },
      title: space.name,
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
      label: connection.gateId
    }))
  };
}
