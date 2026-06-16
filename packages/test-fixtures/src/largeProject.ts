import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

export type LargeProjectOptions = {
  spaceCount?: number;
};

export function createLargeLinearProject(options: LargeProjectOptions = {}): ProjectGraph {
  const spaceCount = options.spaceCount ?? 80;
  const spaces: ProjectGraph['spaces'] = {};
  const connections: ProjectGraph['connections'] = {};
  const gates: ProjectGraph['gates'] = {};
  const tokens: ProjectGraph['tokens'] = {};
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
      kind: index % 5 === 0 ? 'reward' : 'discovery',
      intensity: (index % 10) / 10,
      order: index + 1
    };

    if (index < spaceCount - 1) {
      const nextSpaceId = `space-${index + 2}`;
      const connectionId = `${spaceId}-${nextSpaceId}`;
      const gateId = index > 0 && index % 12 === 0 ? `gate-${index}` : undefined;

      connections[connectionId] = {
        id: connectionId,
        fromSpaceId: spaceId,
        toSpaceId: nextSpaceId,
        ...(gateId === undefined ? {} : { gateId })
      };

      if (gateId !== undefined) {
        const tokenId = `token-${index}`;

        tokens[tokenId] = {
          id: tokenId,
          name: `Token ${index}`,
          kind: 'item',
          locationSpaceId: `space-${Math.max(1, index - 4)}`
        };
        gates[gateId] = {
          id: gateId,
          name: `Gate ${index}`,
          kind: 'lock',
          requiredTokenIds: [tokenId]
        };
      }
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: `large-linear-${spaceCount}`,
      name: `Large Linear ${spaceCount}`
    },
    startSpaceId: 'space-1',
    targetSpaceIds: [`space-${spaceCount}`],
    spaces,
    connections,
    gates,
    tokens,
    puzzles: {},
    beats,
    rulePresetId: 'maze.standard'
  };
}
