import type { Diagnostic, ValidationResult } from '@labyrinth/schema';

function formatList(label: string, values: string[]): string {
  return `${label}: ${values.length > 0 ? values.join(', ') : '(none)'}`;
}

function formatDiagnostic(diagnostic: Diagnostic): string[] {
  return [
    `${diagnostic.severity.toUpperCase()} ${diagnostic.ruleId}: ${diagnostic.message}`,
    `  affected: ${diagnostic.affectedEntities.map((entity) => `${entity.kind}:${entity.id}`).join(', ')}`,
    ...diagnostic.causeChain.map(
      (cause) => `  cause: ${cause.entity.kind}:${cause.entity.id} - ${cause.message}`
    ),
    ...diagnostic.suggestions.map((suggestion) => `  suggestion: ${suggestion.message}`)
  ];
}

export function formatText(result: ValidationResult): string {
  const lines = [
    `${result.ok ? 'PASS' : 'FAIL'} Labyrinth validation`,
    formatList('reachable spaces', result.reachableSpaces),
    formatList('acquired tokens', result.acquiredTokens),
    formatList('opened gates', result.openedGates),
    formatList('solved puzzles', result.solvedPuzzles),
    `diagnostics: ${result.diagnostics.length}`
  ];

  for (const diagnostic of result.diagnostics) {
    lines.push(...formatDiagnostic(diagnostic));
  }

  return `${lines.join('\n')}\n`;
}
