import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import { createValidationComposition } from './validationService.js';

function createLargeProject(spaceCount = 80): ProjectGraph {
  const spaces: ProjectGraph['spaces'] = {};
  const connections: ProjectGraph['connections'] = {};
  const beats: ProjectGraph['beats'] = {};

  for (let index = 0; index < spaceCount; index += 1) {
    const spaceId = `space-${index + 1}`;

    spaces[spaceId] = {
      id: spaceId,
      name: `Space ${index + 1}`
    };
    beats[`beat-${index + 1}`] = {
      id: `beat-${index + 1}`,
      name: `Beat ${index + 1}`,
      spaceId,
      intensity: (index % 10) / 10,
      order: index + 1
    };

    if (index < spaceCount - 1) {
      const nextSpaceId = `space-${index + 2}`;

      connections[`${spaceId}-${nextSpaceId}`] = {
        id: `${spaceId}-${nextSpaceId}`,
        fromSpaceId: spaceId,
        toSpaceId: nextSpaceId
      };
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: `large-validation-${spaceCount}`,
      name: `Large Validation ${spaceCount}`
    },
    startSpaceId: 'space-1',
    targetSpaceIds: [`space-${spaceCount}`],
    spaces,
    connections,
    gates: {},
    tokens: {},
    puzzles: {},
    beats,
    rulePresetId: 'maze.standard'
  };
}

describe('validation service performance smoke', () => {
  it('validates an 80-space project within the beta smoke budget', () => {
    const startedAt = performance.now();
    const composition = createValidationComposition(createLargeProject());
    const elapsedMs = performance.now() - startedAt;

    console.info(`phase4 large validation smoke: ${elapsedMs.toFixed(2)}ms`);
    expect(composition.validation.ok).toBe(true);
    expect(elapsedMs).toBeLessThan(1000);
  });
});
