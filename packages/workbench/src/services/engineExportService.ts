import { createExportTargetText, type ExportTargetId } from '@labyrinth/exporters';

import type { WorkbenchSnapshot } from '../store/createWorkbenchStore.js';

export function createExportTargetTextFromSnapshot(
  snapshot: Pick<WorkbenchSnapshot, 'project' | 'validation' | 'rulePreset'>,
  targetId: ExportTargetId,
  generatedAt?: string
): string {
  return createExportTargetText(targetId, {
    project: snapshot.project,
    validation: snapshot.validation,
    rulePreset: snapshot.rulePreset,
    generatedAt
  });
}

export function createEngineExportText(
  snapshot: Pick<WorkbenchSnapshot, 'project' | 'validation' | 'rulePreset'>,
  generatedAt?: string
): string {
  return createExportTargetTextFromSnapshot(snapshot, 'engine-json', generatedAt);
}
