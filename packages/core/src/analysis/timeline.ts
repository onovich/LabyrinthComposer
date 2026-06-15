import type { Beat, Diagnostic, ProjectGraph } from '@labyrinth/schema';

import { createDiagnostic } from '../validation/diagnostics.js';
import {
  getRuleSeverity,
  getThreshold,
  isRuleEnabled,
  type RuleContext
} from '../validation/ruleContext.js';
import { RULE_IDS } from '../validation/rules.js';
import { ref } from './tokenUses.js';

type OrderedBeat = Beat & {
  id: string;
};

function orderedBeats(project: ProjectGraph): OrderedBeat[] {
  return Object.values(project.beats)
    .filter((beat) => beat.intensity !== undefined)
    .map((beat) => ({
      ...beat,
      order: beat.order ?? Number.MAX_SAFE_INTEGER
    }))
    .sort(
      (left, right) =>
        (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id)
    );
}

export function analyzeTimelinePacing(project: ProjectGraph, context: RuleContext): Diagnostic[] {
  return [
    ...analyzeFlatIntensity(project, context),
    ...analyzeIntensitySpike(project, context)
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function analyzeFlatIntensity(project: ProjectGraph, context: RuleContext): Diagnostic[] {
  if (!isRuleEnabled(context, RULE_IDS.timelineIntensityFlat)) {
    return [];
  }

  const beats = orderedBeats(project);

  if (beats.length < 3) {
    return [];
  }

  const intensities = beats.map((beat) => beat.intensity ?? 0);
  const delta = Math.max(...intensities) - Math.min(...intensities);
  const threshold = getThreshold(context, 'flatIntensityDelta', 0.1);

  if (delta > threshold) {
    return [];
  }

  return [
    createDiagnostic({
      id: `${RULE_IDS.timelineIntensityFlat}:${beats.map((beat) => beat.id).join('|')}`,
      ruleId: RULE_IDS.timelineIntensityFlat,
      severity: getRuleSeverity(context, RULE_IDS.timelineIntensityFlat, 'info'),
      message: `Timeline intensity changes by only ${delta.toFixed(2)} across ${beats.length} beats.`,
      affectedEntities: beats.map((beat) => ref('beat', beat.id)),
      causeChain: beats.map((beat) => ({
        entity: ref('beat', beat.id),
        message: `Beat "${beat.id}" has intensity ${(beat.intensity ?? 0).toFixed(2)}.`
      })),
      suggestions: [
        {
          kind: 'add_hint',
          message: 'Vary beat intensity or add contrast between discovery, pressure, and relief.',
          targetEntities: beats.map((beat) => ref('beat', beat.id))
        }
      ]
    })
  ];
}

function analyzeIntensitySpike(project: ProjectGraph, context: RuleContext): Diagnostic[] {
  if (!isRuleEnabled(context, RULE_IDS.timelineIntensitySpike)) {
    return [];
  }

  const beats = orderedBeats(project);
  const highIntensityThreshold = getThreshold(context, 'highIntensityThreshold', 0.8);
  const maxConsecutiveHigh = getThreshold(context, 'maxConsecutiveHighIntensityBeats', 3);
  const diagnostics: Diagnostic[] = [];
  let run: OrderedBeat[] = [];

  function flushRun(): void {
    if (run.length <= maxConsecutiveHigh) {
      run = [];
      return;
    }

    diagnostics.push(
      createDiagnostic({
        id: `${RULE_IDS.timelineIntensitySpike}:${run.map((beat) => beat.id).join('|')}`,
        ruleId: RULE_IDS.timelineIntensitySpike,
        severity: getRuleSeverity(context, RULE_IDS.timelineIntensitySpike, 'warning'),
        message: `${run.length} high-intensity beats appear without relief.`,
        affectedEntities: run.map((beat) => ref('beat', beat.id)),
        causeChain: run.map((beat) => ({
          entity: ref('beat', beat.id),
          message: `Beat "${beat.id}" has intensity ${(beat.intensity ?? 0).toFixed(2)}.`
        })),
        suggestions: [
          {
            kind: 'add_hint',
            message: 'Insert a relief or discovery beat after the intensity spike.',
            targetEntities: run.map((beat) => ref('beat', beat.id))
          }
        ]
      })
    );
    run = [];
  }

  for (const beat of beats) {
    if ((beat.intensity ?? 0) >= highIntensityThreshold) {
      run.push(beat);
    } else {
      flushRun();
    }
  }

  flushRun();

  return diagnostics;
}
