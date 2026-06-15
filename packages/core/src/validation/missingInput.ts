import type { Diagnostic, EntityRef, ProjectGraph, ValidationResult } from '@labyrinth/schema';

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

export function validateMissingPuzzleInputs(
  project: ProjectGraph,
  reachability: Pick<ValidationResult, 'acquiredTokens' | 'reachableSpaces' | 'solvedPuzzles'>
): Diagnostic[] {
  const acquiredTokens = new Set(reachability.acquiredTokens);
  const reachableSpaces = new Set(reachability.reachableSpaces);
  const solvedPuzzles = new Set(reachability.solvedPuzzles);
  const diagnostics: Diagnostic[] = [];

  for (const [puzzleId, puzzle] of sortedEntries(project.puzzles)) {
    if (!reachableSpaces.has(puzzle.locationSpaceId) || solvedPuzzles.has(puzzleId)) {
      continue;
    }

    for (const tokenId of [...puzzle.requiredTokenIds].sort()) {
      if (!(tokenId in project.tokens) || acquiredTokens.has(tokenId)) {
        continue;
      }

      diagnostics.push(
        createDiagnostic({
          id: `${RULE_IDS.puzzleMissingInput}:${puzzleId}:${tokenId}`,
          ruleId: RULE_IDS.puzzleMissingInput,
          severity: 'warning',
          message: `Puzzle "${puzzleId}" requires token "${tokenId}", but that token is never acquired.`,
          affectedEntities: [ref('puzzle', puzzleId), ref('token', tokenId)],
          causeChain: [
            {
              entity: ref('puzzle', puzzleId),
              message: `Puzzle "${puzzleId}" is reachable but remains unsolved.`
            },
            {
              entity: ref('token', tokenId),
              message: `The fixed-point traversal ended without acquiring token "${tokenId}".`
            }
          ],
          suggestions: [
            {
              kind: 'move_token',
              message: `Place token "${tokenId}" in a reachable space or produce it from an earlier puzzle.`,
              targetEntities: [ref('token', tokenId), ref('puzzle', puzzleId)]
            }
          ]
        })
      );
    }
  }

  return diagnostics;
}
