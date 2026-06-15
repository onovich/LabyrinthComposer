import { createReportModel, formatMarkdownReport } from '@labyrinth/exporters';
import { getRulePreset } from '@labyrinth/rulesets';
import type { Diagnostic, ProjectGraph, ValidationResult } from '@labyrinth/schema';

import { createTimelineViewModel, type TimelineViewModel } from './timelineSelectors.js';

export type ReportDiagnosticSummary = {
  errors: number;
  warnings: number;
  info: number;
  suppressed: number;
};

export type ReportViewModel = {
  projectName: string;
  schemaVersion: string;
  rulePresetName: string;
  summary: ReportDiagnosticSummary;
  diagnostics: Diagnostic[];
  exceptionCount: number;
  timeline: TimelineViewModel;
  markdownPreview: string;
};

function createDiagnosticSummary(diagnostics: Diagnostic[]): ReportDiagnosticSummary {
  return diagnostics.reduce<ReportDiagnosticSummary>(
    (summary, diagnostic) => {
      if (diagnostic.suppressed === true) {
        summary.suppressed += 1;
      }

      if (diagnostic.severity === 'error') {
        summary.errors += 1;
      } else if (diagnostic.severity === 'warning') {
        summary.warnings += 1;
      } else {
        summary.info += 1;
      }

      return summary;
    },
    {
      errors: 0,
      warnings: 0,
      info: 0,
      suppressed: 0
    }
  );
}

export function createReportViewModel(
  project: ProjectGraph,
  validation: ValidationResult
): ReportViewModel {
  const rulePreset = getRulePreset(project.rulePresetId);
  const reportModel = createReportModel(project, validation, rulePreset, 'preview');

  return {
    projectName: project.project.name,
    schemaVersion: project.schemaVersion,
    rulePresetName: rulePreset.name,
    summary: createDiagnosticSummary(validation.diagnostics),
    diagnostics: [...validation.diagnostics].sort((left, right) => left.id.localeCompare(right.id)),
    exceptionCount: project.diagnosticExceptions?.length ?? 0,
    timeline: createTimelineViewModel(project, validation),
    markdownPreview: formatMarkdownReport(reportModel)
  };
}
