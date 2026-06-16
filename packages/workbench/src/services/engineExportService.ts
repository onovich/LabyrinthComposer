import { createEngineExport, formatEngineExportJson } from '@labyrinth/exporters';

import type { WorkbenchSnapshot } from '../store/createWorkbenchStore.js';

export function createEngineExportText(
  snapshot: Pick<WorkbenchSnapshot, 'project' | 'validation' | 'rulePreset'>,
  generatedAt?: string
): string {
  return formatEngineExportJson(
    createEngineExport(snapshot.project, snapshot.validation, snapshot.rulePreset, generatedAt)
  );
}
