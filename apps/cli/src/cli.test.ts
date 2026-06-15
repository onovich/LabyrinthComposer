import { spawnSync } from 'node:child_process';
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
});
