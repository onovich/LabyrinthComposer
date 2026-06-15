import type { Diagnostic, ProjectGraph, ValidationResult } from '@labyrinth/schema';

export type TimelineBeatViewModel = {
  id: string;
  name: string;
  spaceId?: string;
  kind?: string;
  intensity: number;
  order: number;
  diagnosticIds: string[];
};

export type TimelineViewModel = {
  beats: TimelineBeatViewModel[];
  minIntensity: number;
  maxIntensity: number;
  diagnosticCount: number;
};

function diagnosticsForBeat(diagnostics: Diagnostic[], beatId: string): string[] {
  return diagnostics
    .filter((diagnostic) =>
      diagnostic.affectedEntities.some((entity) => entity.kind === 'beat' && entity.id === beatId)
    )
    .map((diagnostic) => diagnostic.id)
    .sort();
}

export function createTimelineViewModel(
  project: ProjectGraph,
  validation?: ValidationResult
): TimelineViewModel {
  const diagnostics = validation?.diagnostics ?? [];
  const beats = Object.values(project.beats)
    .map((beat, index): TimelineBeatViewModel => {
      const intensity = beat.intensity ?? 0;

      return {
        id: beat.id,
        name: beat.name,
        spaceId: beat.spaceId,
        kind: beat.kind,
        intensity,
        order: beat.order ?? index + 1,
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
