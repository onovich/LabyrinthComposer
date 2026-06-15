import type { Diagnostic, ProjectGraph, Token } from '@labyrinth/schema';

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

function tokenDistanceThreshold(token: Token, context: RuleContext): number {
  if (token.kind === 'knowledge' || token.kind === 'state') {
    return getThreshold(
      context,
      'maxClueToUseDistance',
      getThreshold(context, 'maxTokenUseDistance', 4)
    );
  }

  return getThreshold(context, 'maxTokenUseDistance', 4);
}

function nearestDistance(project: ProjectGraph, fromSpaceId: string, toSpaceIds: string[]) {
  const distances = toSpaceIds
    .map((toSpaceId) => shortestSpaceDistance(project, fromSpaceId, toSpaceId))
    .filter((distance): distance is number => distance !== undefined);

  if (distances.length === 0) {
    return undefined;
  }

  return Math.min(...distances);
}

export function analyzeHintDistance(project: ProjectGraph, context: RuleContext): Diagnostic[] {
  return [
    ...analyzeTokenUseDistance(project, context),
    ...analyzeGatePreviewDistance(project, context)
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function analyzeTokenUseDistance(project: ProjectGraph, context: RuleContext): Diagnostic[] {
  if (!isRuleEnabled(context, RULE_IDS.hintTokenUseTooLate)) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];

  for (const use of collectTokenUses(project)) {
    const token = project.tokens[use.tokenId];

    if (token?.locationSpaceId === undefined || use.useSpaceIds.length === 0) {
      continue;
    }

    const distance = nearestDistance(project, token.locationSpaceId, use.useSpaceIds);

    if (distance === undefined) {
      continue;
    }

    const threshold = tokenDistanceThreshold(token, context);

    if (distance <= threshold) {
      continue;
    }

    diagnostics.push(
      createDiagnostic({
        id: `${RULE_IDS.hintTokenUseTooLate}:${use.consumer.kind}:${use.consumer.id}:${use.tokenId}`,
        ruleId: RULE_IDS.hintTokenUseTooLate,
        severity: getRuleSeverity(context, RULE_IDS.hintTokenUseTooLate, 'warning'),
        message: `Token "${use.tokenId}" is used ${distance} spaces after it is acquired.`,
        affectedEntities: [ref('token', use.tokenId), use.consumer],
        causeChain: [
          {
            entity: ref('token', use.tokenId),
            message: `The token starts at "${token.locationSpaceId}".`
          },
          {
            entity: use.consumer,
            message: `The nearest use is ${distance} spaces away, above the threshold of ${threshold}.`
          }
        ],
        suggestions: [
          {
            kind: 'add_hint',
            message: `Add an intermediate reminder for "${use.tokenId}" or move its use closer.`,
            targetEntities: [ref('token', use.tokenId), use.consumer]
          }
        ]
      })
    );
  }

  return diagnostics;
}

function analyzeGatePreviewDistance(project: ProjectGraph, context: RuleContext): Diagnostic[] {
  if (!isRuleEnabled(context, RULE_IDS.hintGateTooLate)) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const minPreviewDistance = getThreshold(context, 'minGatePreviewDistance', 1);

  for (const [gateId, gate] of Object.entries(project.gates).sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    const gatedConnections = Object.values(project.connections)
      .filter((connection) => connection.gateId === gateId)
      .sort((left, right) => left.id.localeCompare(right.id));
    const gateSpaceIds = [
      ...new Set(
        gatedConnections.flatMap((connection) => [connection.fromSpaceId, connection.toSpaceId])
      )
    ].sort();

    if (gateSpaceIds.length === 0) {
      continue;
    }

    const gateDistance = nearestDistance(project, project.startSpaceId, gateSpaceIds);

    if (gateDistance === undefined) {
      continue;
    }

    for (const tokenId of [...gate.requiredTokenIds].sort()) {
      const token = project.tokens[tokenId];

      if (token?.locationSpaceId === undefined) {
        continue;
      }

      const tokenDistance = shortestSpaceDistance(
        project,
        project.startSpaceId,
        token.locationSpaceId
      );

      if (tokenDistance === undefined) {
        continue;
      }

      const previewDistance = tokenDistance - gateDistance;

      if (previewDistance >= minPreviewDistance) {
        continue;
      }

      diagnostics.push(
        createDiagnostic({
          id: `${RULE_IDS.hintGateTooLate}:${gateId}:${tokenId}`,
          ruleId: RULE_IDS.hintGateTooLate,
          severity: getRuleSeverity(context, RULE_IDS.hintGateTooLate, 'warning'),
          message: `Gate "${gateId}" is not previewed before token "${tokenId}" is acquired.`,
          affectedEntities: [ref('gate', gateId), ref('token', tokenId)],
          causeChain: [
            {
              entity: ref('gate', gateId),
              message: `The gate appears ${gateDistance} spaces from the start.`
            },
            {
              entity: ref('token', tokenId),
              message: `The token appears ${tokenDistance} spaces from the start, leaving ${previewDistance} preview spaces.`
            }
          ],
          suggestions: [
            {
              kind: 'add_hint',
              message: `Show gate "${gateId}" at least ${minPreviewDistance} spaces before token "${tokenId}" is found.`,
              targetEntities: [ref('gate', gateId), ref('token', tokenId)]
            }
          ]
        })
      );
    }
  }

  return diagnostics;
}
