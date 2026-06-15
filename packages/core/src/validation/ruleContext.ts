import type {
  Diagnostic,
  DiagnosticException,
  DiagnosticSeverity,
  EntityRef,
  RulePreset,
  RulePresetOverride
} from '@labyrinth/schema';

import { RULE_IDS } from './rules.js';

export type ValidationOptions = {
  preset?: RulePreset;
  overrides?: RulePresetOverride[];
  exceptions?: DiagnosticException[];
};

export type RuleContext = {
  enabledRuleIds: Set<string>;
  disabledRuleIds: Set<string>;
  thresholds: Record<string, number>;
  severityOverrides: Record<string, DiagnosticSeverity>;
};

const defaultEnabledRuleIds = [RULE_IDS.backtrackingLongTokenReturn];

const defaultThresholds: Record<string, number> = {
  flatIntensityDelta: 0.1,
  highIntensityThreshold: 0.8,
  maxBacktrackDistance: 4,
  maxClueToUseDistance: 5,
  maxConsecutiveHighIntensityBeats: 3,
  maxTokenUseDistance: 4,
  minGatePreviewDistance: 1
};

function entityRefKey(ref: EntityRef): string {
  return `${ref.kind}:${ref.id}`;
}

function diagnosticMatchesException(
  diagnostic: Diagnostic,
  exception: DiagnosticException
): boolean {
  if (diagnostic.ruleId !== exception.ruleId) {
    return false;
  }

  const affectedEntities = new Set(diagnostic.affectedEntities.map(entityRefKey));

  return exception.entityRefs.every((ref) => affectedEntities.has(entityRefKey(ref)));
}

export function createRuleContext(options: ValidationOptions = {}): RuleContext {
  const enabledRuleIds = new Set(options.preset?.enabledRuleIds ?? defaultEnabledRuleIds);
  const thresholds = {
    ...defaultThresholds,
    ...(options.preset?.thresholds ?? {})
  };
  const severityOverrides = {
    ...(options.preset?.severityOverrides ?? {})
  };
  const disabledRuleIds = new Set<string>();

  for (const override of options.overrides ?? []) {
    if (override.disabled === true) {
      enabledRuleIds.delete(override.ruleId);
      disabledRuleIds.add(override.ruleId);
    }

    if (override.disabled !== true) {
      enabledRuleIds.add(override.ruleId);
    }

    Object.assign(thresholds, override.thresholdOverrides);

    if (override.severity !== undefined) {
      severityOverrides[override.ruleId] = override.severity;
    }
  }

  return {
    enabledRuleIds,
    disabledRuleIds,
    thresholds,
    severityOverrides
  };
}

export function isRuleEnabled(context: RuleContext, ruleId: string): boolean {
  return context.enabledRuleIds.has(ruleId) && !context.disabledRuleIds.has(ruleId);
}

export function getThreshold(context: RuleContext, key: string, fallback: number): number {
  return context.thresholds[key] ?? fallback;
}

export function getRuleSeverity(
  context: RuleContext,
  ruleId: string,
  fallback: DiagnosticSeverity
): DiagnosticSeverity {
  return context.severityOverrides[ruleId] ?? fallback;
}

export function applyRuleControls(
  diagnostics: Diagnostic[],
  context: RuleContext,
  exceptions: DiagnosticException[] = []
): Diagnostic[] {
  return diagnostics
    .filter((diagnostic) => !context.disabledRuleIds.has(diagnostic.ruleId))
    .map((diagnostic) => {
      const exception = exceptions.find((item) => diagnosticMatchesException(diagnostic, item));
      const severity = getRuleSeverity(context, diagnostic.ruleId, diagnostic.severity);

      if (exception === undefined) {
        return {
          ...diagnostic,
          severity
        };
      }

      return {
        ...diagnostic,
        severity,
        suppressed: true,
        exceptionId: exception.id
      };
    });
}

export function hasBlockingDiagnostics(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some(
    (diagnostic) => diagnostic.severity === 'error' && diagnostic.suppressed !== true
  );
}
