import type { Diagnostic, FixSuggestion } from '@labyrinth/schema';

import type { LabyrinthReportModel, ReportTimelineBeat } from './reportModel.js';

function listItems(values: string[]): string {
  if (values.length === 0) {
    return '- None';
  }

  return values.map((value) => `- ${value}`).join('\n');
}

function entityList(entities: { kind: string; id: string }[]): string {
  return entities.length === 0
    ? 'None'
    : entities.map((entity) => `${entity.kind}:${entity.id}`).join(', ');
}

function suggestionList(suggestions: FixSuggestion[]): string {
  if (suggestions.length === 0) {
    return 'None';
  }

  return suggestions.map((suggestion) => `${suggestion.kind}: ${suggestion.message}`).join('; ');
}

function diagnosticSection(title: string, diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) {
    return [`## ${title}`, '', 'None'].join('\n');
  }

  return [
    `## ${title}`,
    '',
    ...diagnostics.flatMap((diagnostic) => [
      `### ${diagnostic.id}`,
      '',
      `- Rule: ${diagnostic.ruleId}`,
      `- Severity: ${diagnostic.severity}${diagnostic.suppressed === true ? ' (suppressed)' : ''}`,
      `- Affected: ${entityList(diagnostic.affectedEntities)}`,
      `- Message: ${diagnostic.message}`,
      `- Suggestions: ${suggestionList(diagnostic.suggestions)}`,
      diagnostic.exceptionId === undefined ? '' : `- Exception: ${diagnostic.exceptionId}`,
      ''
    ])
  ].join('\n');
}

function timelineLine(beat: ReportTimelineBeat): string {
  const kind = beat.kind ?? 'untyped';
  const space = beat.spaceId ?? 'unplaced';

  return `- ${beat.order}. ${beat.name} (${kind}, intensity ${beat.intensity}, ${space})`;
}

function suggestedFixes(diagnostics: Diagnostic[]): string {
  const suggestions = diagnostics.flatMap((diagnostic) =>
    diagnostic.suggestions.map((suggestion) => `- ${diagnostic.id}: ${suggestion.message}`)
  );

  return suggestions.length === 0 ? '- None' : suggestions.join('\n');
}

export function formatMarkdownReport(model: LabyrinthReportModel): string {
  const errors = model.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const warnings = model.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning');
  const info = model.diagnostics.filter((diagnostic) => diagnostic.severity === 'info');

  return [
    '# Labyrinth Composer Report',
    '',
    `Generated: ${model.generatedAt}`,
    '',
    '## Project',
    '',
    `- Name: ${model.project.name}`,
    `- ID: ${model.project.id}`,
    `- Schema: ${model.schemaVersion}`,
    '',
    '## Rule Preset',
    '',
    `- Name: ${model.rulePreset.name}`,
    `- ID: ${model.rulePreset.id}`,
    model.rulePreset.description === undefined ? '' : `- Description: ${model.rulePreset.description}`,
    '',
    '## Summary',
    '',
    `- Status: ${model.summary.ok ? 'PASS' : 'FAIL'}`,
    `- Errors: ${model.summary.errors}`,
    `- Warnings: ${model.summary.warnings}`,
    `- Info: ${model.summary.info}`,
    `- Suppressed: ${model.summary.suppressed}`,
    '',
    '### Reachable Spaces',
    '',
    listItems(model.summary.reachableSpaces),
    '',
    '### Acquired Tokens',
    '',
    listItems(model.summary.acquiredTokens),
    '',
    '### Opened Gates',
    '',
    listItems(model.summary.openedGates),
    '',
    '### Solved Puzzles',
    '',
    listItems(model.summary.solvedPuzzles),
    '',
    diagnosticSection('Errors', errors),
    '',
    diagnosticSection('Warnings', warnings),
    '',
    diagnosticSection('Info', info),
    '',
    '## Exceptions',
    '',
    model.exceptions.length === 0
      ? '- None'
      : model.exceptions
          .map(
            (exception) =>
              `- ${exception.id}: ${exception.ruleId} (${entityList(exception.entityRefs)})`
          )
          .join('\n'),
    '',
    '## Timeline',
    '',
    model.timeline.beats.length === 0
      ? '- None'
      : model.timeline.beats.map((beat) => timelineLine(beat)).join('\n'),
    '',
    '## Suggested Fixes',
    '',
    suggestedFixes(model.diagnostics),
    ''
  ]
    .filter((line, index, lines) => !(line === '' && lines[index - 1] === ''))
    .join('\n');
}
