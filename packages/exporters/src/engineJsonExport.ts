import type { EngineExport } from './engineExportModel.js';

export function formatEngineExportJson(engineExport: EngineExport): string {
  return `${JSON.stringify(engineExport, null, 2)}\n`;
}
