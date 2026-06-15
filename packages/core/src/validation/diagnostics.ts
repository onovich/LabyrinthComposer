import type {
  CauseStep,
  Diagnostic,
  DiagnosticSeverity,
  EntityRef,
  FixSuggestion
} from '@labyrinth/schema';

type DiagnosticInput = {
  id: string;
  ruleId: string;
  severity: DiagnosticSeverity;
  message: string;
  affectedEntities: EntityRef[];
  causeChain: CauseStep[];
  suggestions: FixSuggestion[];
  suppressed?: boolean;
  exceptionId?: string;
};

export function createDiagnostic(input: DiagnosticInput): Diagnostic {
  const diagnostic: Diagnostic = {
    id: input.id,
    ruleId: input.ruleId,
    severity: input.severity,
    message: input.message,
    affectedEntities: input.affectedEntities,
    causeChain: input.causeChain,
    suggestions: input.suggestions
  };

  if (input.suppressed !== undefined) {
    diagnostic.suppressed = input.suppressed;
  }

  if (input.exceptionId !== undefined) {
    diagnostic.exceptionId = input.exceptionId;
  }

  return diagnostic;
}
