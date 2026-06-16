import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseProjectGraph } from './project.js';
import { SCHEMA_VERSION } from './schemaVersion.js';

const samplesDir = join(process.cwd(), 'packages/test-fixtures/samples');

describe('parseProjectGraph', () => {
  it('accepts every sample project', () => {
    const sampleFiles = readdirSync(samplesDir)
      .filter((file) => file.endsWith('.lcproj.json'))
      .sort();

    expect(sampleFiles.length).toBe(3);

    for (const file of sampleFiles) {
      const value = JSON.parse(readFileSync(join(samplesDir, file), 'utf8')) as unknown;
      const result = parseProjectGraph(value);

      expect(result, file).toEqual(
        expect.objectContaining({
          ok: true
        })
      );
    }
  });

  it('rejects malformed project files with structured issues', () => {
    const result = parseProjectGraph({
      schemaVersion: '0.1.0',
      project: {
        id: 'broken',
        name: 'Broken'
      }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === '/startSpaceId')).toBe(true);
    }
  });

  it('accepts rule preset overrides, diagnostic exceptions, and timeline beat metadata', () => {
    const result = parseProjectGraph({
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'phase2-contract',
        name: 'Phase 2 Contract'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {
        opening: {
          id: 'opening',
          name: 'Opening',
          spaceId: 'start',
          kind: 'discovery',
          intensity: 0.4,
          order: 1
        }
      },
      rulePresetId: 'zelda.mini-dungeon',
      ruleOverrides: [
        {
          ruleId: 'hint.token-use-too-late',
          thresholdOverrides: {
            maxTokenUseDistance: 6
          },
          severity: 'info'
        }
      ],
      diagnosticExceptions: [
        {
          id: 'exception-1',
          ruleId: 'hint.token-use-too-late',
          entityRefs: [
            {
              kind: 'token',
              id: 'hookshot'
            }
          ],
          reason: 'Intentional optional detour.',
          createdAt: '2026-06-16T00:00:00.000Z'
        }
      ]
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true
      })
    );
  });

  it('accepts structured review threads with EntityRef targets', () => {
    const result = parseProjectGraph({
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'review-contract',
        name: 'Review Contract'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {},
      reviewThreads: [
        {
          id: 'review-start',
          target: {
            kind: 'space',
            id: 'start'
          },
          status: 'open',
          comments: [
            {
              id: 'comment-1',
              author: 'Design',
              body: 'Clarify why this is the entry point.',
              createdAt: '2026-06-16T00:00:00.000Z'
            }
          ]
        }
      ]
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true
      })
    );
  });

  it('accepts portable AssetRef entries without requiring local file existence', () => {
    const result = parseProjectGraph({
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'asset-contract',
        name: 'Asset Contract'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {},
      assets: [
        {
          id: 'map-sketch',
          kind: 'image',
          packagePath: 'assets/map-sketch.png',
          label: 'Map sketch',
          mimeType: 'image/png'
        },
        {
          id: 'missing-reference',
          kind: 'document',
          packagePath: 'assets/notes/missing-reference.md'
        }
      ]
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true
      })
    );
  });

  it('rejects AssetRef paths that are absolute or escape the assets directory', () => {
    const baseProject = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'asset-contract',
        name: 'Asset Contract'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {}
    };

    expect(
      parseProjectGraph({
        ...baseProject,
        assets: [
          {
            id: 'absolute',
            kind: 'image',
            packagePath: 'C:\\Users\\designer\\map.png'
          }
        ]
      }).ok
    ).toBe(false);
    expect(
      parseProjectGraph({
        ...baseProject,
        assets: [
          {
            id: 'escape',
            kind: 'image',
            packagePath: 'assets/../map.png'
          }
        ]
      }).ok
    ).toBe(false);
  });

  it('rejects unknown AssetRef kinds while allowing missing referenced files', () => {
    const result = parseProjectGraph({
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'asset-contract',
        name: 'Asset Contract'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {},
      assets: [
        {
          id: 'unknown-kind',
          kind: 'prefab',
          packagePath: 'assets/missing.prefab'
        }
      ]
    });

    expect(result.ok).toBe(false);
  });

  it('rejects review targets that are not EntityRef values', () => {
    const result = parseProjectGraph({
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'review-contract',
        name: 'Review Contract'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {},
      reviewThreads: [
        {
          id: 'review-dom-node',
          target: {
            kind: 'react-flow-node',
            id: 'rf__node-start'
          },
          status: 'open',
          comments: []
        }
      ]
    });

    expect(result.ok).toBe(false);
  });

  it('rejects invalid rule override severity values', () => {
    const result = parseProjectGraph({
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'phase2-contract',
        name: 'Phase 2 Contract'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {},
      ruleOverrides: [
        {
          ruleId: 'hint.token-use-too-late',
          severity: 'critical'
        }
      ]
    });

    expect(result.ok).toBe(false);
  });
});
