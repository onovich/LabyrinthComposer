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
