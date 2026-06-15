import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

import { validateReferences } from '../graph/references.js';
import { validateBacktracking } from '../metrics/backtracking.js';
import { validateCircularDependencies } from './dependencies.js';
import { validateTokenLockedBehindOwnGate } from './deadlocks.js';
import { validateMissingPuzzleInputs } from './missingInput.js';
import {
  evaluateReachability,
  validateProjectAnchors,
  validateReachableTargets
} from './reachability.js';

export function validateProject(project: ProjectGraph): ValidationResult {
  const referenceDiagnostics = validateReferences(project);
  const anchorDiagnostics = validateProjectAnchors(project);
  const reachability = evaluateReachability(project);

  const foundationalDiagnostics = [...anchorDiagnostics, ...referenceDiagnostics];
  const hasFoundationalError = foundationalDiagnostics.some(
    (diagnostic) => diagnostic.severity === 'error'
  );

  if (hasFoundationalError) {
    return {
      ok: false,
      reachableSpaces: reachability.reachableSpaces,
      acquiredTokens: reachability.acquiredTokens,
      openedGates: reachability.openedGates,
      solvedPuzzles: reachability.solvedPuzzles,
      diagnostics: foundationalDiagnostics,
      trace: reachability.trace
    };
  }

  const tokenLockedDiagnostics = validateTokenLockedBehindOwnGate(project, reachability);
  const circularDependencyDiagnostics =
    tokenLockedDiagnostics.length > 0 ? [] : validateCircularDependencies(project);
  const missingPuzzleInputDiagnostics =
    circularDependencyDiagnostics.length > 0
      ? []
      : validateMissingPuzzleInputs(project, reachability);
  const reachableTargetDiagnostics =
    tokenLockedDiagnostics.length > 0 || circularDependencyDiagnostics.length > 0
      ? []
      : validateReachableTargets(project, reachability.reachableSpaces);
  const diagnostics = [
    ...foundationalDiagnostics,
    ...tokenLockedDiagnostics,
    ...circularDependencyDiagnostics,
    ...missingPuzzleInputDiagnostics,
    ...validateBacktracking(project),
    ...reachableTargetDiagnostics
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
