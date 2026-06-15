import type { DiagnosticSeverity } from './diagnostics.js';
import type { EntityRef, RulePresetId } from './entities.js';

export type RulePreset = {
  id: RulePresetId;
  name: string;
  description?: string;
  enabledRuleIds: string[];
  thresholds: Record<string, number>;
  severityOverrides?: Record<string, DiagnosticSeverity>;
};

export type RulePresetOverride = {
  ruleId: string;
  thresholdOverrides?: Record<string, number>;
  severity?: DiagnosticSeverity;
  disabled?: boolean;
};

export type DiagnosticException = {
  id: string;
  ruleId: string;
  entityRefs: EntityRef[];
  reason?: string;
  createdAt?: string;
};
