import type { Connection, ProjectGraph, SpaceId } from '@labyrinth/schema';

export type ConnectionDirection = {
  connection: Connection;
  fromSpaceId: SpaceId;
  toSpaceId: SpaceId;
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

export function getConnectionDirections(project: ProjectGraph): ConnectionDirection[] {
  return sortedEntries(project.connections).flatMap(([, connection]) => {
    const forward: ConnectionDirection = {
      connection,
      fromSpaceId: connection.fromSpaceId,
      toSpaceId: connection.toSpaceId
    };

    if (connection.directed === true) {
      return [forward];
    }

    return [
      forward,
      {
        connection,
        fromSpaceId: connection.toSpaceId,
        toSpaceId: connection.fromSpaceId
      }
    ];
  });
}
