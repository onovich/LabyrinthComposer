import { validateProject } from '@labyrinth/core';
import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

export type WorkbenchStatus = 'idle' | 'validating';

export type WorkbenchSnapshot = {
  project: ProjectGraph | null;
  validation: ValidationResult | null;
  status: WorkbenchStatus;
};

export function createEmptyWorkbenchSnapshot(): WorkbenchSnapshot {
  return {
    project: null,
    validation: null,
    status: 'idle'
  };
}

export function validateWorkbenchProject(project: ProjectGraph): ValidationResult {
  return validateProject(project);
}
