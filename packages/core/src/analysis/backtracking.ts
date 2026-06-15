import type { Diagnostic, ProjectGraph } from '@labyrinth/schema';

import { shortestSpaceDistance } from '../graph/adjacency.js';
import { createDiagnostic } from '../validation/diagnostics.js';
import {
  getRuleSeverity,
  getThreshold,
  isRuleEnabled,
  type RuleContext
} from '../validation/ruleContext.js';
import { RULE_IDS } from '../validation/rules.js';
import { collectTokenUses, ref } from './tokenUses.js';

export function analyzeBacktracking(project: ProjectGraph, context: RuleContext): Diagnostic[] {
  if (!isRuleEnabled(context, RULE_IDS.backtrackingLongTokenReturn)) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const maxDistance = getThreshold(context, 'maxBacktrackDistance', 4);

  for (const use of collectTokenUses(project)) {
    const token = project.tokens[use.tokenId];

    if (token?.locationSpaceId === undefined || use.useSpaceIds.length === 0) {
      continue;
    }

    const distances = use.useSpaceIds
      .map((useSpaceId) => shortestSpaceDistance(project, token.locationSpaceId ?? '', useSpaceId))
      .filter((distance): distance is number => distance !== undefined);

    if (distances.length === 0) {
      continue;
    }

    const distance = Math.min(...distances);

    if (distance <= maxDistance) {
      continue;
    }

    diagnostics.push(
      createDiagnostic({
        id: `${RULE_IDS.backtrackingLongTokenReturn}:${use.consumer.kind}:${use.consumer.id}:${use.tokenId}`,
        ruleId: RULE_IDS.backtrackingLongTokenReturn,
        severity: getRuleSeverity(context, RULE_IDS.backtrackingLongTokenReturn, 'warning'),
        message: `Token "${use.tokenId}" is ${distance} spaces away from its use at ${use.consumer.kind} "${use.consumer.id}".`,
        affectedEntities: [ref('token', use.tokenId), use.consumer],
        causeChain: [
          {
            entity: ref('token', use.tokenId),
            message: `Token "${use.tokenId}" is acquired in space "${token.locationSpaceId}".`
          },
          {
            entity: use.consumer,
            message: `The nearest use is ${distance} connections away, above the threshold of ${maxDistance}.`
          }
        ],
        suggestions: [
          {
            kind: 'move_token',
            message: `Move token "${use.tokenId}" closer to ${use.consumer.kind} "${use.consumer.id}" or add a shortcut.`,
            targetEntities: [ref('token', use.tokenId), use.consumer]
          }
        ]
      })
    );
  }

  return diagnostics;
}
