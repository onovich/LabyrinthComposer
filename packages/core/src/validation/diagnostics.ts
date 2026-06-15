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
};

export function createDiagnostic(input: DiagnosticInput): Diagnostic {
  return {
    id: input.id,
    ruleId: input.ruleId,
    severity: input.severity,
    message: input.message,
    affectedEntities: input.affectedEntities,
    causeChain: input.causeChain,
    suggestions: input.suggestions
  };
}
