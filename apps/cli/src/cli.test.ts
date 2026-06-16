import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseProjectGraph, type Diagnostic, type ValidationResult } from '@labyrinth/schema';
import { createValidationComposition } from '@labyrinth/workbench';

const tsxCli = join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
const cliEntry = join(process.cwd(), 'apps/cli/src/index.ts');

function runCli(args: string[]) {
  return spawnSync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

function readProject(path: string) {
  const parsed = parseProjectGraph(JSON.parse(readFileSync(path, 'utf8')) as unknown);

  if (!parsed.ok) {
    throw new Error(`${path} failed schema parse: ${JSON.stringify(parsed.issues)}`);
  }

  return parsed.project;
}

function summarizeDiagnostics(diagnostics: Diagnostic[]) {
  return diagnostics.map((diagnostic) => ({
    id: diagnostic.id,
    ruleId: diagnostic.ruleId,
    severity: diagnostic.severity,
    affectedEntities: diagnostic.affectedEntities
  }));
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

  it('keeps warning-only validation passing unless strict mode is enabled', () => {
    const warningProject =
      'packages/test-fixtures/rulesets/ruleset.maze.standard/02-long-gate-return.lcproj.json';
    const nonStrict = runCli(['validate', warningProject, '--format', 'json']);
    const strict = runCli(['validate', warningProject, '--format', 'json', '--strict']);
    const nonStrictResult = JSON.parse(nonStrict.stdout) as {
      ok: boolean;
      diagnostics: Array<{ severity: string }>;
    };
    const strictResult = JSON.parse(strict.stdout) as {
      ok: boolean;
      diagnostics: Array<{ severity: string }>;
    };

    expect(nonStrict.status).toBe(0);
    expect(nonStrictResult.ok).toBe(true);
    expect(nonStrictResult.diagnostics.map((diagnostic) => diagnostic.severity)).toEqual([
      'warning'
    ]);
    expect(strict.status).toBe(1);
    expect(strictResult.diagnostics.map((diagnostic) => diagnostic.severity)).toEqual(['warning']);
  });

  it('uses --ruleset diagnostics for strict validation', () => {
    const rulesetProject =
      'packages/test-fixtures/rulesets/ruleset.horror.clinic/02-flat-timeline.lcproj.json';
    const nonStrict = runCli([
      'validate',
      rulesetProject,
      '--ruleset',
      'horror.clinic',
      '--format',
      'json'
    ]);
    const strict = runCli([
      'validate',
      rulesetProject,
      '--ruleset',
      'horror.clinic',
      '--format',
      'json',
      '--strict'
    ]);
    const nonStrictResult = JSON.parse(nonStrict.stdout) as ValidationResult;
    const strictResult = JSON.parse(strict.stdout) as ValidationResult;

    expect(nonStrict.status).toBe(0);
    expect(nonStrictResult.ok).toBe(true);
    expect(nonStrictResult.diagnostics.map((diagnostic) => diagnostic.ruleId)).toContain(
      'timeline.intensity-flat'
    );
    expect(strict.status).toBe(1);
    expect(strictResult.diagnostics.map((diagnostic) => diagnostic.severity)).toContain('info');
  });

  it('matches workbench validation composition diagnostics', () => {
    const rulesetProject =
      'packages/test-fixtures/rulesets/ruleset.horror.clinic/02-flat-timeline.lcproj.json';
    const result = runCli([
      'validate',
      rulesetProject,
      '--ruleset',
      'horror.clinic',
      '--format',
      'json'
    ]);
    const cliValidation = JSON.parse(result.stdout) as ValidationResult;
    const workbenchValidation = createValidationComposition(readProject(rulesetProject), {
      rulePresetId: 'horror.clinic'
    }).validation;

    expect(result.status).toBe(0);
    expect(summarizeDiagnostics(cliValidation.diagnostics)).toEqual(
      summarizeDiagnostics(workbenchValidation.diagnostics)
    );
  });

  it('returns exit code 2 for file read failures', () => {
    const result = runCli(['validate', 'packages/test-fixtures/missing-project.lcproj.json']);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Failed to read');
  });

  it('validates an .lcproj package by reading project.json', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'labyrinth-package-source-'));
    const packagePath = join(outputDir, 'horror-clinic.lcproj');

    mkdirSync(packagePath);
    copyFileSync(
      join(process.cwd(), 'packages/test-fixtures/samples/horror-clinic.lcproj.json'),
      join(packagePath, 'project.json')
    );

    const result = runCli(['validate', packagePath, '--format', 'json']);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout) as unknown).toEqual(
      expect.objectContaining({
        ok: true,
        diagnostics: []
      })
    );
  });

  it('ignores generated .lcproj artifacts during validation', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'labyrinth-package-artifacts-'));
    const packagePath = join(outputDir, 'horror-clinic.lcproj');

    mkdirSync(join(packagePath, 'reports'), {
      recursive: true
    });
    mkdirSync(join(packagePath, 'cache'), {
      recursive: true
    });
    copyFileSync(
      join(process.cwd(), 'packages/test-fixtures/samples/horror-clinic.lcproj.json'),
      join(packagePath, 'project.json')
    );
    writeFileSync(join(packagePath, 'reports', 'latest-report.json'), '{not-valid-json', 'utf8');
    writeFileSync(join(packagePath, 'cache', 'layout-cache.json'), '{not-valid-json', 'utf8');

    const result = runCli(['validate', packagePath, '--format', 'json']);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout) as unknown).toEqual(
      expect.objectContaining({
        ok: true,
        diagnostics: []
      })
    );
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

  it('writes a JSON report to --out for CI artifacts', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'labyrinth-report-'));
    const outputPath = join(outputDir, 'report.json');
    const result = runCli([
      'report',
      'packages/test-fixtures/samples/horror-clinic.lcproj.json',
      '--format',
      'json',
      '--out',
      outputPath
    ]);
    const report = JSON.parse(readFileSync(outputPath, 'utf8')) as {
      project: { id: string };
      rulePreset: { id: string };
    };

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(report.project.id).toBe('horror-clinic');
    expect(report.rulePreset.id).toBe('horror.clinic');
  });

  it('writes JSON reports into .lcproj package reports artifacts', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'labyrinth-report-package-'));
    const packagePath = join(outputDir, 'horror-clinic.lcproj');
    const result = runCli([
      'report',
      'packages/test-fixtures/samples/horror-clinic.lcproj.json',
      '--format',
      'json',
      '--out',
      packagePath
    ]);
    const report = JSON.parse(
      readFileSync(join(packagePath, 'reports', 'latest-report.json'), 'utf8')
    ) as {
      project: { id: string };
    };

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(report.project.id).toBe('horror-clinic');
  });

  it('returns exit code 2 for unsupported export targets', () => {
    const result = runCli([
      'export',
      'packages/test-fixtures/samples/horror-clinic.lcproj.json',
      '--target',
      'unity-scene'
    ]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('--target must be "engine-json"');
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

  it('writes engine exports into .lcproj package export artifacts', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'labyrinth-export-package-'));
    const packagePath = join(outputDir, 'zelda-mini-dungeon.lcproj');
    const result = runCli([
      'export',
      'packages/test-fixtures/samples/zelda-mini-dungeon.lcproj.json',
      '--target',
      'engine-json',
      '--out',
      packagePath
    ]);
    const engineExport = JSON.parse(
      readFileSync(join(packagePath, 'exports', 'engine-export.json'), 'utf8')
    ) as {
      sourceProject: { id: string };
    };

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(engineExport.sourceProject.id).toBe('zelda-mini-dungeon');
  });
});
