import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

import { validateReferences } from '../graph/references.js';
import {
  evaluateReachability,
  validateProjectAnchors,
  validateReachableTargets
} from './reachability.js';

export function validateProject(project: ProjectGraph): ValidationResult {
  const referenceDiagnostics = validateReferences(project);
  const anchorDiagnostics = validateProjectAnchors(project);
  const reachability = evaluateReachability(project);
  const diagnostics = [
    ...anchorDiagnostics,
    ...referenceDiagnostics,
    ...validateReachableTargets(project, reachability.reachableSpaces)
  ];

  return {
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    reachableSpaces: reachability.reachableSpaces,
    acquiredTokens: reachability.acquiredTokens,
    openedGates: reachability.openedGates,
    solvedPuzzles: reachability.solvedPuzzles,
    diagnostics,
    trace: reachability.trace
  };
}
