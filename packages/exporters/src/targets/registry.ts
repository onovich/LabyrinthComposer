import {
  LCPROJ_PACKAGE_ARTIFACTS,
  type LcprojPackageArtifactKind,
  type ProjectGraph,
  type RulePreset,
  type ValidationResult
} from '@labyrinth/schema';

import { formatEngineExportJson } from '../engineJsonExport.js';
import { createEngineExport } from '../engineExportModel.js';

export type ExportTargetId = 'engine-json';

export type ExportTargetContext = {
  project: ProjectGraph;
  validation: ValidationResult;
  rulePreset: RulePreset;
  generatedAt?: string;
};

export type ExportTarget = {
  id: ExportTargetId;
  label: string;
  description: string;
  mediaType: string;
  fileExtension: string;
  packageArtifactKind: LcprojPackageArtifactKind;
  packageArtifactPath: string[];
  generate(context: ExportTargetContext): string;
};

export type ExportTargetSummary = Omit<ExportTarget, 'generate'>;

const exportTargets = [
  {
    id: 'engine-json',
    label: 'Engine JSON',
    description:
      'Stable engine-facing JSON DTO generated from project, validation, and ruleset state.',
    mediaType: 'application/json',
    fileExtension: '.json',
    packageArtifactKind: 'engineExport',
    packageArtifactPath: [...LCPROJ_PACKAGE_ARTIFACTS.engineExport.path],
    generate(context) {
      return formatEngineExportJson(
        createEngineExport(
          context.project,
          context.validation,
          context.rulePreset,
          context.generatedAt
        )
      );
    }
  }
] satisfies ExportTarget[];

export function listExportTargets(): ExportTargetSummary[] {
  return exportTargets.map(({ generate: _generate, ...target }) => ({
    ...target,
    packageArtifactPath: [...target.packageArtifactPath]
  }));
}

export function findExportTarget(targetId: string): ExportTarget | undefined {
  return exportTargets.find((target) => target.id === targetId);
}

export function formatExportTargetChoices(): string {
  return listExportTargets()
    .map((target) => target.id)
    .join(', ');
}

export function formatExportTargetList(): string {
  return [
    'Available export targets:',
    ...listExportTargets().map(
      (target) =>
        `  ${target.id}  ${target.label} (${target.mediaType}) -> ${target.packageArtifactPath.join('/')}`
    )
  ].join('\n');
}

export function createExportTargetText(
  targetId: ExportTargetId,
  context: ExportTargetContext
): string {
  const target = findExportTarget(targetId);

  if (target === undefined) {
    throw new Error(`Unsupported export target: ${targetId}`);
  }

  return target.generate(context);
}
