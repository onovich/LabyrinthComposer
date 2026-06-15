import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

import type { Beat, ProjectGraph, RulePresetId } from '../packages/schema/src/index.js';
import { parseProjectGraph, SCHEMA_VERSION } from '../packages/schema/src/index.js';
import { validateProjectWithRules } from '../packages/core/src/index.js';
import { getRulePreset } from '../packages/rulesets/src/index.js';

type FixtureCase = {
  presetId: RulePresetId;
  slug: string;
  project: ProjectGraph;
};

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = join(repoRoot, 'packages/test-fixtures/rulesets');

async function writeJson(path: string, value: unknown): Promise<void> {
  writeFileSync(path, await format(JSON.stringify(value), { parser: 'json' }));
}

function beat(id: string, intensity: number, order: number, kind?: Beat['kind']): Beat {
  return {
    id,
    name: id.toUpperCase(),
    kind,
    intensity,
    order
  };
}

function linearProject(
  id: string,
  options: {
    spaceCount?: number;
    tokenIndex?: number;
    tokenKind?: ProjectGraph['tokens'][string]['kind'];
    gateIndex?: number;
    puzzleIndex?: number;
    shortcut?: boolean;
    missingTarget?: boolean;
    disconnectedTarget?: boolean;
    directedBackwards?: boolean;
    beats?: Record<string, Beat>;
  } = {}
): ProjectGraph {
  const spaceCount = options.spaceCount ?? 6;
  const spaces = Object.fromEntries(
    Array.from({ length: spaceCount + 1 }, (_, index) => [
      `s${index}`,
      {
        id: `s${index}`,
        name: `Space ${index}`
      }
    ])
  );
  const connections: ProjectGraph['connections'] = {};

  if (options.disconnectedTarget !== true) {
    for (let index = 0; index < spaceCount; index += 1) {
      connections[`s${index}-s${index + 1}`] = {
        id: `s${index}-s${index + 1}`,
        fromSpaceId: options.directedBackwards === true ? `s${index + 1}` : `s${index}`,
        toSpaceId: options.directedBackwards === true ? `s${index}` : `s${index + 1}`,
        directed: options.directedBackwards === true
      };
    }
  }

  spaces.exit = {
    id: 'exit',
    name: 'Exit'
  };
  connections['s-last-exit'] = {
    id: 's-last-exit',
    fromSpaceId: `s${spaceCount}`,
    toSpaceId: 'exit',
    gateId: options.gateIndex === spaceCount ? 'key-gate' : undefined
  };

  if (options.gateIndex !== undefined && options.gateIndex < spaceCount) {
    const gatedConnection = connections[`s${options.gateIndex}-s${options.gateIndex + 1}`];

    if (gatedConnection !== undefined) {
      gatedConnection.gateId = 'key-gate';
    }
  }

  if (options.shortcut === true) {
    connections['shortcut'] = {
      id: 'shortcut',
      fromSpaceId: 's0',
      toSpaceId: `s${spaceCount}`
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id,
      name: id
    },
    startSpaceId: 's0',
    targetSpaceIds: [options.missingTarget === true ? 'missing-exit' : 'exit'],
    spaces,
    connections,
    gates:
      options.gateIndex === undefined
        ? {}
        : {
            'key-gate': {
              id: 'key-gate',
              name: 'Key Gate',
              kind: options.tokenKind === 'ability' ? 'ability' : 'lock',
              requiredTokenIds: ['key']
            }
          },
    tokens:
      options.tokenIndex === undefined
        ? {}
        : {
            key: {
              id: 'key',
              name: 'Key',
              kind: options.tokenKind ?? 'item',
              locationSpaceId: `s${options.tokenIndex}`
            }
          },
    puzzles:
      options.puzzleIndex === undefined
        ? {}
        : {
            lockPuzzle: {
              id: 'lockPuzzle',
              name: 'Lock Puzzle',
              locationSpaceId: `s${options.puzzleIndex}`,
              requiredTokenIds: ['key'],
              outputTokenIds: []
            }
          },
    beats: options.beats ?? {}
  };
}

const cases: FixtureCase[] = [
  {
    presetId: 'maze.standard',
    slug: '01-open-route',
    project: linearProject('maze-open-route')
  },
  {
    presetId: 'maze.standard',
    slug: '02-long-gate-return',
    project: linearProject('maze-long-gate-return', { gateIndex: 6, tokenIndex: 0 })
  },
  {
    presetId: 'maze.standard',
    slug: '03-threshold-edge',
    project: linearProject('maze-threshold-edge', { gateIndex: 5, tokenIndex: 0 })
  },
  {
    presetId: 'maze.standard',
    slug: '04-puzzle-long-return',
    project: linearProject('maze-puzzle-long-return', { puzzleIndex: 6, tokenIndex: 0 })
  },
  {
    presetId: 'maze.standard',
    slug: '05-puzzle-threshold-edge',
    project: linearProject('maze-puzzle-threshold-edge', { puzzleIndex: 5, tokenIndex: 0 })
  },
  {
    presetId: 'maze.standard',
    slug: '06-shortcut-return',
    project: linearProject('maze-shortcut-return', {
      gateIndex: 6,
      tokenIndex: 0,
      shortcut: true
    })
  },
  {
    presetId: 'maze.standard',
    slug: '07-missing-target',
    project: linearProject('maze-missing-target', { missingTarget: true })
  },
  {
    presetId: 'maze.standard',
    slug: '08-disconnected-target',
    project: linearProject('maze-disconnected-target', { disconnectedTarget: true })
  },
  {
    presetId: 'maze.standard',
    slug: '09-directed-backwards',
    project: linearProject('maze-directed-backwards', { directedBackwards: true })
  },
  {
    presetId: 'maze.standard',
    slug: '10-ability-return',
    project: linearProject('maze-ability-return', {
      gateIndex: 6,
      tokenIndex: 0,
      tokenKind: 'ability'
    })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '01-open-route',
    project: linearProject('zelda-open-route')
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '02-long-item-use',
    project: linearProject('zelda-long-item-use', { gateIndex: 6, tokenIndex: 0 })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '03-long-puzzle-input',
    project: linearProject('zelda-long-puzzle-input', { puzzleIndex: 6, tokenIndex: 0 })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '04-ability-gate-late',
    project: linearProject('zelda-ability-gate-late', {
      gateIndex: 6,
      tokenIndex: 0,
      tokenKind: 'ability'
    })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '05-knowledge-long-use',
    project: linearProject('zelda-knowledge-long-use', {
      gateIndex: 6,
      tokenIndex: 0,
      tokenKind: 'knowledge'
    })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '06-threshold-edge',
    project: linearProject('zelda-threshold-edge', { gateIndex: 4, tokenIndex: 0, spaceCount: 4 })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '07-gate-after-token',
    project: linearProject('zelda-gate-after-token', { gateIndex: 5, tokenIndex: 0 })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '08-shortcut-item-use',
    project: linearProject('zelda-shortcut-item-use', {
      gateIndex: 6,
      tokenIndex: 0,
      shortcut: true
    })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '09-missing-input',
    project: linearProject('zelda-missing-input', { puzzleIndex: 2 })
  },
  {
    presetId: 'zelda.mini-dungeon',
    slug: '10-disconnected-target',
    project: linearProject('zelda-disconnected-target', { disconnectedTarget: true })
  },
  {
    presetId: 'horror.clinic',
    slug: '01-open-route',
    project: linearProject('horror-open-route')
  },
  {
    presetId: 'horror.clinic',
    slug: '02-flat-timeline',
    project: linearProject('horror-flat-timeline', {
      beats: {
        a: beat('a', 0.51, 1, 'discovery'),
        b: beat('b', 0.5, 2, 'threat'),
        c: beat('c', 0.52, 3, 'puzzle')
      }
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '03-intensity-spike',
    project: linearProject('horror-intensity-spike', {
      beats: {
        a: beat('a', 0.9, 1, 'threat'),
        b: beat('b', 0.91, 2, 'threat'),
        c: beat('c', 0.92, 3, 'threat'),
        d: beat('d', 0.93, 4, 'threat')
      }
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '04-flat-spike',
    project: linearProject('horror-flat-spike', {
      beats: {
        a: beat('a', 0.88, 1, 'threat'),
        b: beat('b', 0.89, 2, 'threat'),
        c: beat('c', 0.9, 3, 'threat'),
        d: beat('d', 0.91, 4, 'threat')
      }
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '05-clue-long-use',
    project: linearProject('horror-clue-long-use', {
      gateIndex: 6,
      tokenIndex: 0,
      tokenKind: 'knowledge'
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '06-relief-breaks-spike',
    project: linearProject('horror-relief-breaks-spike', {
      beats: {
        a: beat('a', 0.9, 1, 'threat'),
        b: beat('b', 0.91, 2, 'threat'),
        c: beat('c', 0.2, 3, 'relief'),
        d: beat('d', 0.92, 4, 'threat')
      }
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '07-short-clue',
    project: linearProject('horror-short-clue', {
      gateIndex: 3,
      tokenIndex: 0,
      tokenKind: 'knowledge',
      spaceCount: 3
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '08-low-flat-timeline',
    project: linearProject('horror-low-flat-timeline', {
      beats: {
        a: beat('a', 0.1, 1, 'discovery'),
        b: beat('b', 0.12, 2, 'discovery'),
        c: beat('c', 0.11, 3, 'relief')
      }
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '09-spike-with-reward',
    project: linearProject('horror-spike-with-reward', {
      beats: {
        a: beat('a', 0.95, 1, 'threat'),
        b: beat('b', 0.96, 2, 'puzzle'),
        c: beat('c', 0.97, 3, 'threat'),
        d: beat('d', 0.98, 4, 'reward')
      }
    })
  },
  {
    presetId: 'horror.clinic',
    slug: '10-no-beats',
    project: linearProject('horror-no-beats')
  }
];

function sortAffectedEntities(affectedEntities: Array<{ kind: string; id: string }>) {
  return [...affectedEntities].sort((left, right) =>
    `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`)
  );
}

function summarizeTimeline(project: ProjectGraph) {
  return Object.values(project.beats)
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      intensity: item.intensity,
      order: item.order
    }))
    .sort(
      (left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id)
    );
}

function expectedFor(fixture: FixtureCase) {
  const parsed = parseProjectGraph(fixture.project);

  if (!parsed.ok) {
    throw new Error(`${fixture.slug} failed schema parse: ${JSON.stringify(parsed.issues)}`);
  }

  const result = validateProjectWithRules(parsed.project, {
    preset: getRulePreset(fixture.presetId)
  });

  return {
    presetId: fixture.presetId,
    ok: result.ok,
    reachableSpaces: result.reachableSpaces,
    acquiredTokens: result.acquiredTokens,
    openedGates: result.openedGates,
    solvedPuzzles: result.solvedPuzzles,
    diagnostics: result.diagnostics
      .map((diagnostic) => ({
        id: diagnostic.id,
        ruleId: diagnostic.ruleId,
        severity: diagnostic.severity,
        suppressed: diagnostic.suppressed,
        exceptionId: diagnostic.exceptionId,
        affectedEntities: sortAffectedEntities(diagnostic.affectedEntities)
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    timeline: summarizeTimeline(fixture.project)
  };
}

rmSync(outputRoot, { recursive: true, force: true });

for (const fixture of cases) {
  const dir = join(outputRoot, `ruleset.${fixture.presetId}`);

  mkdirSync(dir, { recursive: true });
  await writeJson(join(dir, `${fixture.slug}.lcproj.json`), fixture.project);
  await writeJson(join(dir, `${fixture.slug}.expected.json`), expectedFor(fixture));
}

console.log(`Generated ${cases.length} ruleset fixtures in ${outputRoot}`);
