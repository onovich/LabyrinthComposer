import { validateProjectWithRules } from '@labyrinth/core';
import { getRulePreset } from '@labyrinth/rulesets';
import type { ProjectGraph, RulePreset, RulePresetId, ValidationResult } from '@labyrinth/schema';

export type ValidationCompositionOptions = {
  rulePresetId?: RulePresetId;
};

export type ValidationComposition = {
  rulePreset: RulePreset;
  validation: ValidationResult;
};

export function createValidationComposition(
  project: ProjectGraph,
  options: ValidationCompositionOptions = {}
): ValidationComposition {
  const rulePreset = getRulePreset(options.rulePresetId ?? project.rulePresetId);

  return {
    rulePreset,
    validation: validateProjectWithRules(project, {
      preset: rulePreset,
      overrides: project.ruleOverrides,
      exceptions: project.diagnosticExceptions
    })
  };
}
