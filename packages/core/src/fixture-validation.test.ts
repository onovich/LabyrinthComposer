import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseProjectGraph } from '@labyrinth/schema';

import { validateProject } from './index.js';

type ExpectedDiagnostic = {
  ruleId: string;
  severity: string;
  affectedEntities: Array<{
    kind: string;
    id: string;
  }>;
};

type ExpectedValidation = {
  ok: boolean;
  diagnostics: ExpectedDiagnostic[];
};

function collectProjectFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectProjectFiles(path);
    }

    return entry.name.endsWith('.lcproj.json') ? [path] : [];
  });
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function validateFixture(path: string) {
  const parsed = parseProjectGraph(readJson(path));

  if (!parsed.ok) {
    throw new Error(`${path} failed schema parse: ${JSON.stringify(parsed.issues)}`);
  }

  return validateProject(parsed.project);
}

describe('fixture validation', () => {
  it('keeps all sample projects valid and diagnostic-free', () => {
    const samplesDir = join(process.cwd(), 'packages/test-fixtures/samples');
    const sampleFiles = collectProjectFiles(samplesDir);

    expect(sampleFiles.length).toBe(3);

    for (const sampleFile of sampleFiles) {
      const result = validateFixture(sampleFile);

      expect(result.ok, sampleFile).toBe(true);
      expect(result.diagnostics, sampleFile).toEqual([]);
    }
  });

  it('matches expected diagnostics for file-based cases', () => {
    const casesDir = join(process.cwd(), 'packages/test-fixtures/cases');
    const caseFiles = collectProjectFiles(casesDir);

    expect(caseFiles.length).toBeGreaterThanOrEqual(17);

    for (const caseFile of caseFiles) {
      const expected = readJson(
        caseFile.replace(/\.lcproj\.json$/, '.expected.json')
      ) as ExpectedValidation;
      const result = validateFixture(caseFile);

      expect(result.ok, caseFile).toBe(expected.ok);

      for (const expectedDiagnostic of expected.diagnostics) {
        expect(result.diagnostics, caseFile).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ruleId: expectedDiagnostic.ruleId,
              severity: expectedDiagnostic.severity,
              affectedEntities: expectedDiagnostic.affectedEntities
            })
          ])
        );
      }
    }
  });
});
