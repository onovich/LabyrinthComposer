import type { Diagnostic, EntityKind, EntityRef, ProjectGraph } from '@labyrinth/schema';

import { createDiagnostic } from '../validation/diagnostics.js';
import { RULE_IDS } from '../validation/rules.js';

type ReferenceCheck = {
  owner: EntityRef;
  field: string;
  target: EntityRef;
};

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function entityExists(project: ProjectGraph, ref: EntityRef): boolean {
  switch (ref.kind) {
    case 'beat':
      return ref.id in project.beats;
    case 'connection':
      return ref.id in project.connections;
    case 'gate':
      return ref.id in project.gates;
    case 'puzzle':
      return ref.id in project.puzzles;
    case 'space':
      return ref.id in project.spaces;
    case 'token':
      return ref.id in project.tokens;
  }
}

function ref(kind: EntityKind, id: string): EntityRef {
  return {
    kind,
    id
  };
}

function missingReferenceDiagnostic(check: ReferenceCheck): Diagnostic {
  return createDiagnostic({
    id: `reference.missing-entity:${check.owner.kind}:${check.owner.id}:${check.field}:${check.target.kind}:${check.target.id}`,
    ruleId: RULE_IDS.referenceMissingEntity,
    severity: 'error',
    message: `${check.owner.kind} "${check.owner.id}" references missing ${check.target.kind} "${check.target.id}".`,
    affectedEntities: [check.owner, check.target],
    causeChain: [
      {
        entity: check.owner,
        message: `Field "${check.field}" points to ${check.target.kind} "${check.target.id}", but that entity is not present in the project graph.`
      }
    ],
    suggestions: [
      {
        kind: 'remove_requirement',
        message: `Create ${check.target.kind} "${check.target.id}" or remove this reference from "${check.field}".`,
        targetEntities: [check.owner]
      }
    ]
  });
}

export function collectReferenceChecks(project: ProjectGraph): ReferenceCheck[] {
  const checks: ReferenceCheck[] = [];

  for (const [id, connection] of sortedEntries(project.connections)) {
    const owner = ref('connection', id);
    checks.push({
      owner,
      field: 'fromSpaceId',
      target: ref('space', connection.fromSpaceId)
    });
    checks.push({
      owner,
      field: 'toSpaceId',
      target: ref('space', connection.toSpaceId)
    });

    if (connection.gateId !== undefined) {
      checks.push({
        owner,
        field: 'gateId',
        target: ref('gate', connection.gateId)
      });
    }
  }

  for (const [id, gate] of sortedEntries(project.gates)) {
    for (const tokenId of [...gate.requiredTokenIds].sort()) {
      checks.push({
        owner: ref('gate', id),
        field: 'requiredTokenIds',
        target: ref('token', tokenId)
      });
    }
  }

  for (const [id, token] of sortedEntries(project.tokens)) {
    if (token.locationSpaceId !== undefined) {
      checks.push({
        owner: ref('token', id),
        field: 'locationSpaceId',
        target: ref('space', token.locationSpaceId)
      });
    }
  }

  for (const [id, puzzle] of sortedEntries(project.puzzles)) {
    const owner = ref('puzzle', id);
    checks.push({
      owner,
      field: 'locationSpaceId',
      target: ref('space', puzzle.locationSpaceId)
    });

    for (const tokenId of [...puzzle.requiredTokenIds].sort()) {
      checks.push({
        owner,
        field: 'requiredTokenIds',
        target: ref('token', tokenId)
      });
    }

    for (const tokenId of [...puzzle.outputTokenIds].sort()) {
      checks.push({
        owner,
        field: 'outputTokenIds',
        target: ref('token', tokenId)
      });
    }
  }

  for (const [id, beat] of sortedEntries(project.beats)) {
    if (beat.spaceId !== undefined) {
      checks.push({
        owner: ref('beat', id),
        field: 'spaceId',
        target: ref('space', beat.spaceId)
      });
    }
  }

  return checks;
}

export function validateReferences(project: ProjectGraph): Diagnostic[] {
  return collectReferenceChecks(project)
    .filter((check) => !entityExists(project, check.target))
    .map(missingReferenceDiagnostic);
}
