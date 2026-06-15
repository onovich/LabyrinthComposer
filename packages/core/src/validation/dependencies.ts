import type { Diagnostic, EntityKind, EntityRef, ProjectGraph } from '@labyrinth/schema';

import { isSpaceReachableWithoutGate } from '../graph/adjacency.js';
import { createDiagnostic } from './diagnostics.js';
import { RULE_IDS } from './rules.js';

type DependencyNode = `${EntityKind}:${string}`;

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function node(kind: EntityKind, id: string): DependencyNode {
  return `${kind}:${id}`;
}

function nodeToRef(value: DependencyNode): EntityRef {
  const [kind, id] = value.split(':', 2);

  return {
    kind: kind as EntityKind,
    id: id ?? ''
  };
}

function addEdge(
  edges: Map<DependencyNode, Set<DependencyNode>>,
  from: DependencyNode,
  to: DependencyNode
): void {
  const outgoing = edges.get(from) ?? new Set<DependencyNode>();
  outgoing.add(to);
  edges.set(from, outgoing);

  if (!edges.has(to)) {
    edges.set(to, new Set());
  }
}

function buildDependencyGraph(project: ProjectGraph): Map<DependencyNode, Set<DependencyNode>> {
  const edges = new Map<DependencyNode, Set<DependencyNode>>();

  for (const [id, gate] of sortedEntries(project.gates)) {
    const gateNode = node('gate', id);
    for (const tokenId of [...gate.requiredTokenIds].sort()) {
      if (tokenId in project.tokens) {
        addEdge(edges, gateNode, node('token', tokenId));
      }
    }
  }

  for (const [id, puzzle] of sortedEntries(project.puzzles)) {
    const puzzleNode = node('puzzle', id);

    for (const tokenId of [...puzzle.requiredTokenIds].sort()) {
      if (tokenId in project.tokens) {
        addEdge(edges, puzzleNode, node('token', tokenId));
      }
    }

    for (const tokenId of [...puzzle.outputTokenIds].sort()) {
      if (tokenId in project.tokens) {
        addEdge(edges, node('token', tokenId), puzzleNode);
      }
    }
  }

  for (const [gateId] of sortedEntries(project.gates)) {
    for (const [tokenId, token] of sortedEntries(project.tokens)) {
      if (
        token.locationSpaceId !== undefined &&
        !isSpaceReachableWithoutGate(project, token.locationSpaceId, gateId)
      ) {
        addEdge(edges, node('token', tokenId), node('gate', gateId));
      }
    }

    for (const [puzzleId, puzzle] of sortedEntries(project.puzzles)) {
      if (!isSpaceReachableWithoutGate(project, puzzle.locationSpaceId, gateId)) {
        addEdge(edges, node('puzzle', puzzleId), node('gate', gateId));
      }
    }
  }

  return edges;
}

function cycleKey(cycle: DependencyNode[]): string {
  return [...cycle].sort().join('|');
}

function findCycles(edges: Map<DependencyNode, Set<DependencyNode>>): DependencyNode[][] {
  const cycles: DependencyNode[][] = [];
  const seen = new Set<string>();
  const nodes = [...edges.keys()].sort();

  function visit(start: DependencyNode, current: DependencyNode, path: DependencyNode[]): void {
    const nextNodes = [...(edges.get(current) ?? [])].sort();

    for (const next of nextNodes) {
      if (next === start && path.length > 1) {
        const cycle = [...path];
        const key = cycleKey(cycle);

        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
        continue;
      }

      if (!path.includes(next) && next >= start) {
        visit(start, next, [...path, next]);
      }
    }
  }

  for (const start of nodes) {
    visit(start, start, [start]);
  }

  return cycles.sort((left, right) => cycleKey(left).localeCompare(cycleKey(right)));
}

function cycleDiagnostic(cycle: DependencyNode[]): Diagnostic {
  const refs = cycle.map(nodeToRef);
  const key = cycleKey(cycle);

  return createDiagnostic({
    id: `${RULE_IDS.dependencyCircularTokenRequirement}:${key}`,
    ruleId: RULE_IDS.dependencyCircularTokenRequirement,
    severity: 'error',
    message: `Dependency cycle detected: ${cycle.join(' -> ')}.`,
    affectedEntities: refs,
    causeChain: refs.map((entity, index) => ({
      entity,
      message: `This entity depends on ${cycle[(index + 1) % cycle.length]}.`
    })),
    suggestions: [
      {
        kind: 'remove_requirement',
        message:
          'Break the cycle by moving a token earlier, removing a requirement, or moving the puzzle before the gate.',
        targetEntities: refs
      }
    ]
  });
}

export function validateCircularDependencies(project: ProjectGraph): Diagnostic[] {
  return findCycles(buildDependencyGraph(project)).map(cycleDiagnostic);
}
