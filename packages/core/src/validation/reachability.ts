import type {
  Diagnostic,
  EntityRef,
  ProjectGraph,
  SpaceId,
  TokenId,
  ValidationResult,
  ValidationTraceEvent
} from '@labyrinth/schema';

import { getConnectionDirections } from '../graph/traversal.js';
import { createDiagnostic } from './diagnostics.js';
import { RULE_IDS } from './rules.js';

type ReachabilityState = {
  reachableSpaces: Set<SpaceId>;
  acquiredTokens: Set<TokenId>;
  openedGates: Set<string>;
  solvedPuzzles: Set<string>;
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function sortedSetValues(values: Set<string>): string[] {
  return [...values].sort();
}

function ref(kind: EntityRef['kind'], id: string): EntityRef {
  return {
    kind,
    id
  };
}

function hasEveryToken(tokenIds: string[], acquiredTokens: Set<string>): boolean {
  return tokenIds.every((tokenId) => acquiredTokens.has(tokenId));
}

function pushEvent(events: ValidationTraceEvent[], event: ValidationTraceEvent): void {
  events.push(event);
}

export function evaluateReachability(project: ProjectGraph): Omit<ValidationResult, 'diagnostics' | 'ok'> {
  const state: ReachabilityState = {
    reachableSpaces: new Set(),
    acquiredTokens: new Set(),
    openedGates: new Set(),
    solvedPuzzles: new Set()
  };
  const trace: ValidationResult['trace'] = [];

  if (project.startSpaceId in project.spaces) {
    state.reachableSpaces.add(project.startSpaceId);
    trace.push({
      iteration: 0,
      events: [
        {
          kind: 'space_reached',
          entity: ref('space', project.startSpaceId),
          message: `Start space "${project.startSpaceId}" is reachable.`
        }
      ]
    });
  }

  let iteration = 1;

  while (true) {
    const events: ValidationTraceEvent[] = [];

    for (const [id, token] of sortedEntries(project.tokens)) {
      if (
        token.locationSpaceId !== undefined &&
        state.reachableSpaces.has(token.locationSpaceId) &&
        !state.acquiredTokens.has(id)
      ) {
        state.acquiredTokens.add(id);
        pushEvent(events, {
          kind: 'token_acquired',
          entity: ref('token', id),
          message: `Token "${id}" is acquired in reachable space "${token.locationSpaceId}".`
        });
      }
    }

    for (const [id, puzzle] of sortedEntries(project.puzzles)) {
      if (
        state.reachableSpaces.has(puzzle.locationSpaceId) &&
        hasEveryToken(puzzle.requiredTokenIds, state.acquiredTokens) &&
        !state.solvedPuzzles.has(id)
      ) {
        state.solvedPuzzles.add(id);
        pushEvent(events, {
          kind: 'puzzle_solved',
          entity: ref('puzzle', id),
          message: `Puzzle "${id}" is solved in reachable space "${puzzle.locationSpaceId}".`
        });

        for (const tokenId of [...puzzle.outputTokenIds].sort()) {
          if (tokenId in project.tokens && !state.acquiredTokens.has(tokenId)) {
            state.acquiredTokens.add(tokenId);
            pushEvent(events, {
              kind: 'token_acquired',
              entity: ref('token', tokenId),
              message: `Token "${tokenId}" is produced by puzzle "${id}".`
            });
          }
        }
      }
    }

    for (const [id, gate] of sortedEntries(project.gates)) {
      if (hasEveryToken(gate.requiredTokenIds, state.acquiredTokens) && !state.openedGates.has(id)) {
        state.openedGates.add(id);
        pushEvent(events, {
          kind: 'gate_opened',
          entity: ref('gate', id),
          message: `Gate "${id}" is open because all required tokens are acquired.`
        });
      }
    }

    const reachableAtStartOfExpansion = new Set(state.reachableSpaces);

    for (const direction of getConnectionDirections(project)) {
      const canTraverse =
        direction.connection.gateId === undefined || state.openedGates.has(direction.connection.gateId);

      if (
        canTraverse &&
        reachableAtStartOfExpansion.has(direction.fromSpaceId) &&
        direction.toSpaceId in project.spaces &&
        !state.reachableSpaces.has(direction.toSpaceId)
      ) {
        state.reachableSpaces.add(direction.toSpaceId);
        pushEvent(events, {
          kind: 'space_reached',
          entity: ref('space', direction.toSpaceId),
          message: `Connection "${direction.connection.id}" reaches space "${direction.toSpaceId}".`
        });
      }
    }

    if (events.length === 0) {
      break;
    }

    trace.push({
      iteration,
      events
    });
    iteration += 1;
  }

  return {
    reachableSpaces: sortedSetValues(state.reachableSpaces),
    acquiredTokens: sortedSetValues(state.acquiredTokens),
    openedGates: sortedSetValues(state.openedGates),
    solvedPuzzles: sortedSetValues(state.solvedPuzzles),
    trace
  };
}

export function validateProjectAnchors(project: ProjectGraph): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (!(project.startSpaceId in project.spaces)) {
    diagnostics.push(
      createDiagnostic({
        id: `${RULE_IDS.projectMissingStartSpace}:${project.startSpaceId}`,
        ruleId: RULE_IDS.projectMissingStartSpace,
        severity: 'error',
        message: `Start space "${project.startSpaceId}" does not exist.`,
        affectedEntities: [ref('space', project.startSpaceId)],
        causeChain: [
          {
            entity: ref('space', project.startSpaceId),
            message: 'The project startSpaceId points to a missing space entity.'
          }
        ],
        suggestions: [
          {
            kind: 'add_connection',
            message: `Add a space with id "${project.startSpaceId}" or choose an existing start space.`,
            targetEntities: [ref('space', project.startSpaceId)]
          }
        ]
      })
    );
  }

  for (const targetSpaceId of [...project.targetSpaceIds].sort()) {
    if (!(targetSpaceId in project.spaces)) {
      diagnostics.push(
        createDiagnostic({
          id: `${RULE_IDS.projectMissingTargetSpace}:${targetSpaceId}`,
          ruleId: RULE_IDS.projectMissingTargetSpace,
          severity: 'error',
          message: `Target space "${targetSpaceId}" does not exist.`,
          affectedEntities: [ref('space', targetSpaceId)],
          causeChain: [
            {
              entity: ref('space', targetSpaceId),
              message: 'The project targetSpaceIds list includes a missing space entity.'
            }
          ],
          suggestions: [
            {
              kind: 'add_connection',
              message: `Add a space with id "${targetSpaceId}" or remove it from targetSpaceIds.`,
              targetEntities: [ref('space', targetSpaceId)]
            }
          ]
        })
      );
    }
  }

  return diagnostics;
}

export function validateReachableTargets(
  project: ProjectGraph,
  reachableSpaces: string[]
): Diagnostic[] {
  if (!(project.startSpaceId in project.spaces)) {
    return [];
  }

  const reachableSpaceSet = new Set(reachableSpaces);
  const diagnostics: Diagnostic[] = [];

  for (const targetSpaceId of [...project.targetSpaceIds].sort()) {
    if (targetSpaceId in project.spaces && !reachableSpaceSet.has(targetSpaceId)) {
      diagnostics.push(
        createDiagnostic({
          id: `${RULE_IDS.reachabilityTargetUnreachable}:${targetSpaceId}`,
          ruleId: RULE_IDS.reachabilityTargetUnreachable,
          severity: 'error',
          message: `Target space "${targetSpaceId}" is not reachable from "${project.startSpaceId}".`,
          affectedEntities: [ref('space', project.startSpaceId), ref('space', targetSpaceId)],
          causeChain: [
            {
              entity: ref('space', project.startSpaceId),
              message: 'Reachability starts from this space.'
            },
            {
              entity: ref('space', targetSpaceId),
              message: 'The fixed-point traversal ended without reaching this target.'
            }
          ],
          suggestions: [
            {
              kind: 'add_connection',
              message: `Add an accessible connection, token, or puzzle chain that reaches "${targetSpaceId}".`,
              targetEntities: [ref('space', targetSpaceId)]
            }
          ]
        })
      );
    }
  }

  return diagnostics;
}
