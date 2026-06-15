import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

import { analyzeBacktracking } from '../analysis/backtracking.js';
import { analyzeHintDistance } from '../analysis/hintDistance.js';
import { analyzeTimelinePacing } from '../analysis/timeline.js';
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
import {
  applyRuleControls,
  createRuleContext,
  hasBlockingDiagnostics,
  type ValidationOptions
} from './ruleContext.js';

type InternalValidationOptions = {
  includeDefaultBacktracking: boolean;
};

function validateProjectInternal(
  project: ProjectGraph,
  options: InternalValidationOptions
): ValidationResult {
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
    ...(options.includeDefaultBacktracking ? validateBacktracking(project) : []),
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

export function validateProject(project: ProjectGraph): ValidationResult {
  return validateProjectInternal(project, {
    includeDefaultBacktracking: true
  });
}

export function validateProjectWithRules(
  project: ProjectGraph,
  options: ValidationOptions = {}
): ValidationResult {
  const baseResult = validateProjectInternal(project, {
    includeDefaultBacktracking: false
  });
  const context = createRuleContext(options);
  const ruleDiagnostics = [
    ...analyzeBacktracking(project, context),
    ...analyzeHintDistance(project, context),
    ...analyzeTimelinePacing(project, context)
  ];
  const diagnostics = applyRuleControls(
    [...baseResult.diagnostics, ...ruleDiagnostics],
    context,
    options.exceptions
  );

  return {
    ...baseResult,
    ok: !hasBlockingDiagnostics(diagnostics),
    diagnostics
  };
}
