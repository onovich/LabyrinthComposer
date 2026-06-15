import type {
  Diagnostic,
  DiagnosticSeverity,
  EntityRef,
  ValidationResult
} from '@labyrinth/schema';

export type ValidationSummaryViewModel = {
  ok: boolean;
  reachableSpaces: string[];
  acquiredTokens: string[];
  openedGates: string[];
  solvedPuzzles: string[];
  diagnosticCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
};

export type DiagnosticViewModel = Diagnostic & {
  highlightedEntities: EntityRef[];
};

const severityRank: Record<DiagnosticSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
};

export function entityRefKey(entity: EntityRef): string {
  return `${entity.kind}:${entity.id}`;
}

function pushUniqueEntity(entities: EntityRef[], seen: Set<string>, entity: EntityRef) {
  const key = entityRefKey(entity);

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  entities.push(entity);
}

export function createHighlightedEntitiesForDiagnostic(
  diagnostic: Diagnostic | null | undefined
): EntityRef[] {
  if (diagnostic === null || diagnostic === undefined) {
    return [];
  }

  const highlightedEntities: EntityRef[] = [];
  const seen = new Set<string>();

  for (const entity of diagnostic.affectedEntities) {
    pushUniqueEntity(highlightedEntities, seen, entity);
  }

  for (const step of diagnostic.causeChain) {
    pushUniqueEntity(highlightedEntities, seen, step.entity);
  }

  for (const suggestion of diagnostic.suggestions) {
    for (const entity of suggestion.targetEntities) {
      pushUniqueEntity(highlightedEntities, seen, entity);
    }
  }

  return highlightedEntities;
}

export function createDiagnosticViewModels(validation: ValidationResult): DiagnosticViewModel[] {
  return [...validation.diagnostics]
    .sort((left, right) => {
      const severityDelta = severityRank[left.severity] - severityRank[right.severity];

      if (severityDelta !== 0) {
        return severityDelta;
      }

      const ruleDelta = left.ruleId.localeCompare(right.ruleId);

      if (ruleDelta !== 0) {
        return ruleDelta;
      }

      return left.id.localeCompare(right.id);
    })
    .map((diagnostic) => ({
      ...diagnostic,
      highlightedEntities: createHighlightedEntitiesForDiagnostic(diagnostic)
    }));
}

export function createValidationSummary(validation: ValidationResult): ValidationSummaryViewModel {
  return {
    ok: validation.ok,
    reachableSpaces: validation.reachableSpaces,
    acquiredTokens: validation.acquiredTokens,
    openedGates: validation.openedGates,
    solvedPuzzles: validation.solvedPuzzles,
    diagnosticCount: validation.diagnostics.length,
    errorCount: validation.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
      .length,
    warningCount: validation.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning')
      .length,
    infoCount: validation.diagnostics.filter((diagnostic) => diagnostic.severity === 'info').length
  };
}
