import {
  createReportModel,
  formatJsonReport,
  formatMarkdownReport,
  type ReportFormat
} from '@labyrinth/exporters';

import type { WorkbenchSnapshot } from '../store/createWorkbenchStore.js';

export type { ReportFormat };

export function createReportText(
  snapshot: Pick<WorkbenchSnapshot, 'project' | 'validation' | 'rulePreset'>,
  format: ReportFormat,
  generatedAt?: string
): string {
  const model = createReportModel(
    snapshot.project,
    snapshot.validation,
    snapshot.rulePreset,
    generatedAt
  );

  return format === 'json' ? formatJsonReport(model) : formatMarkdownReport(model);
}
