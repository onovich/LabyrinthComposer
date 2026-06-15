import type { Diagnostic, EntityRef, ProjectGraph } from '@labyrinth/schema';

import { shortestSpaceDistance } from '../graph/adjacency.js';
import { createDiagnostic } from '../validation/diagnostics.js';
import { RULE_IDS } from '../validation/rules.js';

const DEFAULT_LONG_BACKTRACK_DISTANCE = 4;

type TokenUse = {
  consumer: EntityRef;
  tokenId: string;
  useSpaceIds: string[];
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function ref(kind: EntityRef['kind'], id: string): EntityRef {
  return {
    kind,
    id
  };
}

function collectTokenUses(project: ProjectGraph): TokenUse[] {
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

export function validateBacktracking(project: ProjectGraph): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const use of collectTokenUses(project)) {
    const token = project.tokens[use.tokenId];

    if (token?.locationSpaceId === undefined || use.useSpaceIds.length === 0) {
      continue;
    }

    const distances = use.useSpaceIds
      .map((useSpaceId) => shortestSpaceDistance(project, token.locationSpaceId ?? '', useSpaceId))
      .filter((distance): distance is number => distance !== undefined);

    if (distances.length === 0) {
      continue;
    }

    const distance = Math.min(...distances);

    if (distance <= DEFAULT_LONG_BACKTRACK_DISTANCE) {
      continue;
    }

    diagnostics.push(
      createDiagnostic({
        id: `${RULE_IDS.backtrackingLongTokenReturn}:${use.consumer.kind}:${use.consumer.id}:${use.tokenId}`,
        ruleId: RULE_IDS.backtrackingLongTokenReturn,
        severity: 'warning',
        message: `Token "${use.tokenId}" is ${distance} spaces away from its use at ${use.consumer.kind} "${use.consumer.id}".`,
        affectedEntities: [ref('token', use.tokenId), use.consumer],
        causeChain: [
          {
            entity: ref('token', use.tokenId),
            message: `Token "${use.tokenId}" is acquired in space "${token.locationSpaceId}".`
          },
          {
            entity: use.consumer,
            message: `The nearest use is ${distance} connections away, above the Phase 0 threshold of ${DEFAULT_LONG_BACKTRACK_DISTANCE}.`
          }
        ],
        suggestions: [
          {
            kind: 'move_token',
            message: `Move token "${use.tokenId}" closer to ${use.consumer.kind} "${use.consumer.id}" or add a shortcut.`,
            targetEntities: [ref('token', use.tokenId), use.consumer]
          }
        ]
      })
    );
  }

  return diagnostics;
}
