import type { LabyrinthReportModel } from './reportModel.js';

export function formatJsonReport(model: LabyrinthReportModel): string {
  return `${JSON.stringify(model, null, 2)}\n`;
}
