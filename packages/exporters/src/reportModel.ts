import type { Diagnostic, ProjectGraph, RulePreset, ValidationResult } from '@labyrinth/schema';

export type ReportFormat = 'markdown' | 'json';

export type ReportSummary = {
  ok: boolean;
  errors: number;
  warnings: number;
  info: number;
  suppressed: number;
  reachableSpaces: string[];
  acquiredTokens: string[];
  openedGates: string[];
  solvedPuzzles: string[];
};

export type ReportTimelineBeat = {
  id: string;
  name: string;
  order: number;
  kind?: string;
  intensity: number;
  spaceId?: string;
  diagnosticIds: string[];
};

export type ReportTimeline = {
  beats: ReportTimelineBeat[];
  minIntensity: number;
  maxIntensity: number;
  diagnosticCount: number;
};

export type LabyrinthReportModel = {
  generatedAt: string;
  schemaVersion: string;
  project: ProjectGraph['project'];
  rulePreset: Pick<RulePreset, 'id' | 'name' | 'description'>;
  summary: ReportSummary;
  diagnostics: Diagnostic[];
  exceptions: NonNullable<ProjectGraph['diagnosticExceptions']>;
  timeline: ReportTimeline;
};

function diagnosticsForBeat(diagnostics: Diagnostic[], beatId: string): string[] {
  return diagnostics
    .filter((diagnostic) =>
      diagnostic.affectedEntities.some((entity) => entity.kind === 'beat' && entity.id === beatId)
    )
    .map((diagnostic) => diagnostic.id)
    .sort();
}

function createSummary(validation: ValidationResult): ReportSummary {
  return validation.diagnostics.reduce<ReportSummary>(
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
      ok: validation.ok,
      errors: 0,
      warnings: 0,
      info: 0,
      suppressed: 0,
      reachableSpaces: [...validation.reachableSpaces],
      acquiredTokens: [...validation.acquiredTokens],
      openedGates: [...validation.openedGates],
      solvedPuzzles: [...validation.solvedPuzzles]
    }
  );
}

function createTimeline(project: ProjectGraph, diagnostics: Diagnostic[]): ReportTimeline {
  const beats = Object.values(project.beats)
    .map((beat, index): ReportTimelineBeat => {
      const intensity = beat.intensity ?? 0;

      return {
        id: beat.id,
        name: beat.name,
        order: beat.order ?? index + 1,
        kind: beat.kind,
        intensity,
        spaceId: beat.spaceId,
        diagnosticIds: diagnosticsForBeat(diagnostics, beat.id)
      };
    })
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const intensities = beats.map((beat) => beat.intensity);

  return {
    beats,
    minIntensity: intensities.length === 0 ? 0 : Math.min(...intensities),
    maxIntensity: intensities.length === 0 ? 0 : Math.max(...intensities),
    diagnosticCount: beats.reduce((count, beat) => count + beat.diagnosticIds.length, 0)
  };
}

export function createReportModel(
  project: ProjectGraph,
  validation: ValidationResult,
  rulePreset: RulePreset,
  generatedAt = new Date().toISOString()
): LabyrinthReportModel {
  const diagnostics = [...validation.diagnostics].sort((left, right) =>
    left.id.localeCompare(right.id)
  );

  return {
    generatedAt,
    schemaVersion: project.schemaVersion,
    project: { ...project.project },
    rulePreset: {
      id: rulePreset.id,
      name: rulePreset.name,
      description: rulePreset.description
    },
    summary: createSummary(validation),
    diagnostics,
    exceptions: [...(project.diagnosticExceptions ?? [])].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
    timeline: createTimeline(project, diagnostics)
  };
}
