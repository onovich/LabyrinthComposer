import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

import { validateReferences } from '../graph/references.js';

export function validateProject(project: ProjectGraph): ValidationResult {
  const diagnostics = validateReferences(project);

  return {
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    reachableSpaces: [],
    acquiredTokens: [],
    openedGates: [],
    solvedPuzzles: [],
    diagnostics,
    trace: []
  };
}
