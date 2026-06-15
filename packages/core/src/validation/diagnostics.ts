import type {
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
  cause: {
    entity: EntityRef;
    message: string;
  };
  suggestions: FixSuggestion[];
};

export function createDiagnostic(input: DiagnosticInput): Diagnostic {
  return {
    id: input.id,
    ruleId: input.ruleId,
    severity: input.severity,
    message: input.message,
    affectedEntities: input.affectedEntities,
    causeChain: [
      {
        entity: input.cause.entity,
        message: input.cause.message
      }
    ],
    suggestions: input.suggestions
  };
}
