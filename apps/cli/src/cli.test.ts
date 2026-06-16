import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tsxCli = join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
const cliEntry = join(process.cwd(), 'apps/cli/src/index.ts');

function runCli(args: string[]) {
  return spawnSync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

describe('labyrinth CLI', () => {
  it('validates a sample project as JSON', () => {
    const result = runCli([
      'validate',
      'packages/test-fixtures/samples/horror-clinic.lcproj.json',
      '--format',
      'json'
    ]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout) as unknown).toEqual(
      expect.objectContaining({
        ok: true,
        diagnostics: []
      })
    );
  });

  it('returns exit code 1 when validation has error diagnostics', () => {
    const result = runCli([
      'validate',
      'packages/test-fixtures/cases/reachability.target-unreachable/disconnected-target.lcproj.json'
    ]);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('FAIL');
    expect(result.stdout).toContain('reachability.target-unreachable');
  });

  it('generates a Markdown report for review workflows', () => {
    const result = runCli([
      'report',
      'packages/test-fixtures/samples/horror-clinic.lcproj.json',
      '--format',
      'markdown'
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('# Labyrinth Composer Report');
    expect(result.stdout).toContain('## Rule Preset');
    expect(result.stdout).toContain('Horror Clinic');
  });

  it('generates a JSON report for CI artifacts', () => {
    const result = runCli([
      'report',
      'packages/test-fixtures/samples/horror-clinic.lcproj.json',
      '--format',
      'json'
    ]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout) as unknown).toEqual(
      expect.objectContaining({
        project: expect.objectContaining({
          name: 'Horror Clinic'
        }),
        rulePreset: expect.objectContaining({
          id: 'horror.clinic'
        })
      })
    );
  });

  it('generates engine JSON export on stdout', () => {
    const result = runCli([
      'export',
      'packages/test-fixtures/samples/zelda-mini-dungeon.lcproj.json',
      '--target',
      'engine-json'
    ]);
    const engineExport = JSON.parse(result.stdout) as {
      exportVersion: string;
      sourceProject: { rulePresetId?: string; rulePresetName: string };
      spaces: Array<{ id: string }>;
      gates: Array<{ id: string }>;
      tokens: Array<{ id: string }>;
    };

    expect(result.status).toBe(0);
    expect(engineExport.exportVersion).toBe('0.1.0');
    expect(engineExport.sourceProject.rulePresetId).toBe('zelda');
    expect(engineExport.sourceProject.rulePresetName).toBe('Zelda Mini Dungeon');
    expect(engineExport.spaces.length).toBeGreaterThan(0);
    expect(engineExport.gates.length).toBeGreaterThan(0);
    expect(engineExport.tokens.length).toBeGreaterThan(0);
  });

  it('writes engine JSON export to --out', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'labyrinth-export-'));
    const outputPath = join(outputDir, 'engine-export.json');
    const result = runCli([
      'export',
      'packages/test-fixtures/samples/horror-clinic.lcproj.json',
      '--target',
      'engine-json',
      '--out',
      outputPath
    ]);
    const engineExport = JSON.parse(readFileSync(outputPath, 'utf8')) as {
      sourceProject: { id: string };
      validation: { diagnostics: unknown[] };
    };

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(engineExport.sourceProject.id).toBe('horror-clinic');
    expect(Array.isArray(engineExport.validation.diagnostics)).toBe(true);
  });
});
