import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseProjectGraph } from './project.js';

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
});
