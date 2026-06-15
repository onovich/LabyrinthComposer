import type { EntityRef, ProjectGraph } from '@labyrinth/schema';

export type TokenUse = {
  consumer: EntityRef;
  tokenId: string;
  useSpaceIds: string[];
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

export function ref(kind: EntityRef['kind'], id: string): EntityRef {
  return {
    kind,
    id
  };
}

export function collectTokenUses(project: ProjectGraph): TokenUse[] {
  const uses: TokenUse[] = [];

  for (const [gateId, gate] of sortedEntries(project.gates)) {
    const gatedConnections = sortedEntries(project.connections)
      .map(([, connection]) => connection)
      .filter((connection) => connection.gateId === gateId);
    const useSpaceIds = [
      ...new Set(
        gatedConnections.flatMap((connection) => [connection.fromSpaceId, connection.toSpaceId])
      )
    ].sort();

    for (const tokenId of [...gate.requiredTokenIds].sort()) {
      uses.push({
        consumer: ref('gate', gateId),
        tokenId,
        useSpaceIds
      });
    }
  }

  for (const [puzzleId, puzzle] of sortedEntries(project.puzzles)) {
    for (const tokenId of [...puzzle.requiredTokenIds].sort()) {
      uses.push({
        consumer: ref('puzzle', puzzleId),
        tokenId,
        useSpaceIds: [puzzle.locationSpaceId]
      });
    }
  }

  return uses;
}
