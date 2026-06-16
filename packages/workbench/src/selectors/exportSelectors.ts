import type { ProjectGraph, ValidationResult } from '@labyrinth/schema';

export type ExportViewModel = {
  projectName: string;
  spaces: number;
  connections: number;
  gates: number;
  tokens: number;
  puzzles: number;
  beats: number;
  diagnostics: number;
  validationOk: boolean;
};

export function createExportViewModel(
  project: ProjectGraph,
  validation: ValidationResult
): ExportViewModel {
  return {
    projectName: project.project.name,
    spaces: Object.keys(project.spaces).length,
    connections: Object.keys(project.connections).length,
    gates: Object.keys(project.gates).length,
    tokens: Object.keys(project.tokens).length,
    puzzles: Object.keys(project.puzzles).length,
    beats: Object.keys(project.beats).length,
    diagnostics: validation.diagnostics.length,
    validationOk: validation.ok
  };
}
