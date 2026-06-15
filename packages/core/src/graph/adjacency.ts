import type { ProjectGraph, SpaceId } from '@labyrinth/schema';

import { getConnectionDirections } from './traversal.js';

export function isSpaceReachableWithoutGate(
  project: ProjectGraph,
  targetSpaceId: SpaceId,
  blockedGateId: string
): boolean {
  if (!(project.startSpaceId in project.spaces) || !(targetSpaceId in project.spaces)) {
    return false;
  }

  const visited = new Set<SpaceId>([project.startSpaceId]);
  const queue: SpaceId[] = [project.startSpaceId];
  const directions = getConnectionDirections(project).filter(
    (direction) => direction.connection.gateId !== blockedGateId
  );

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === undefined) {
      break;
    }

    if (current === targetSpaceId) {
      return true;
    }

    for (const direction of directions) {
      if (
        direction.fromSpaceId === current &&
        direction.toSpaceId in project.spaces &&
        !visited.has(direction.toSpaceId)
      ) {
        visited.add(direction.toSpaceId);
        queue.push(direction.toSpaceId);
      }
    }
  }

  return visited.has(targetSpaceId);
}

export function shortestSpaceDistance(
  project: ProjectGraph,
  fromSpaceId: SpaceId,
  toSpaceId: SpaceId
): number | undefined {
  if (!(fromSpaceId in project.spaces) || !(toSpaceId in project.spaces)) {
    return undefined;
  }

  const distances = new Map<SpaceId, number>([[fromSpaceId, 0]]);
  const queue: SpaceId[] = [fromSpaceId];
  const directions = getConnectionDirections(project);

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === undefined) {
      break;
    }

    const currentDistance = distances.get(current);

    if (currentDistance === undefined) {
      continue;
    }

    if (current === toSpaceId) {
      return currentDistance;
    }

    for (const direction of directions) {
      if (
        direction.fromSpaceId === current &&
        direction.toSpaceId in project.spaces &&
        !distances.has(direction.toSpaceId)
      ) {
        distances.set(direction.toSpaceId, currentDistance + 1);
        queue.push(direction.toSpaceId);
      }
    }
  }

  return undefined;
}
