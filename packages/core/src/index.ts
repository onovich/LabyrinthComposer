import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

export function validateProject(_project: ProjectGraph): ValidationResult {
  return {
    ok: true,
    reachableSpaces: [],
    acquiredTokens: [],
    openedGates: [],
    solvedPuzzles: [],
    diagnostics: [],
    trace: []
  };
}
