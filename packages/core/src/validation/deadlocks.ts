import type { Diagnostic, EntityRef, ProjectGraph, ValidationResult } from '@labyrinth/schema';

import { isSpaceReachableWithoutGate } from '../graph/adjacency.js';
import { createDiagnostic } from './diagnostics.js';
import { RULE_IDS } from './rules.js';

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function ref(kind: EntityRef['kind'], id: string): EntityRef {
  return {
    kind,
    id
  };
}

export function validateTokenLockedBehindOwnGate(
  project: ProjectGraph,
  reachability: Pick<ValidationResult, 'acquiredTokens' | 'openedGates'>
): Diagnostic[] {
  const acquiredTokens = new Set(reachability.acquiredTokens);
  const openedGates = new Set(reachability.openedGates);
  const diagnostics: Diagnostic[] = [];

  for (const [gateId, gate] of sortedEntries(project.gates)) {
    if (openedGates.has(gateId)) {
      continue;
    }

    for (const tokenId of [...gate.requiredTokenIds].sort()) {
      const token = project.tokens[tokenId];

      if (
        token === undefined ||
        token.locationSpaceId === undefined ||
        acquiredTokens.has(tokenId) ||
        isSpaceReachableWithoutGate(project, token.locationSpaceId, gateId)
      ) {
        continue;
      }

      diagnostics.push(
        createDiagnostic({
          id: `${RULE_IDS.reachabilityTokenLockedBehindOwnGate}:${gateId}:${tokenId}`,
          ruleId: RULE_IDS.reachabilityTokenLockedBehindOwnGate,
          severity: 'error',
          message: `Token "${tokenId}" is locked behind gate "${gateId}", which requires that same token.`,
          affectedEntities: [
            ref('gate', gateId),
            ref('token', tokenId),
            ref('space', token.locationSpaceId)
          ],
          causeChain: [
            {
              entity: ref('gate', gateId),
              message: `Gate "${gateId}" requires token "${tokenId}".`
            },
            {
              entity: ref('token', tokenId),
              message: `Token "${tokenId}" is placed in space "${token.locationSpaceId}", which cannot be reached without opening gate "${gateId}".`
            }
          ],
          suggestions: [
            {
              kind: 'move_token',
              message: `Move token "${tokenId}" before gate "${gateId}" or remove it from the gate requirements.`,
              targetEntities: [ref('token', tokenId), ref('gate', gateId)]
            }
          ]
        })
      );
    }
  }

  return diagnostics;
}
