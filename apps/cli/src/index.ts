#!/usr/bin/env node

import { formatExportTargetChoices } from '@labyrinth/exporters';

import { runExport } from './commands/export.js';
import { runValidate } from './commands/validate.js';
import { runReport } from './commands/report.js';

async function main(args: string[]): Promise<number> {
  const command = args[0];

  if (command === 'validate') {
    return runValidate(args.slice(1), {
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  if (command === 'report') {
    return runReport(args.slice(1), {
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  if (command === 'export') {
    return runExport(args.slice(1), {
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  process.stderr.write(
    [
      'Usage:',
      '  labyrinth validate <project-file> [--format text|json] [--strict]',
      '  labyrinth report <project-file> [--format markdown|json] [--out file]',
      '  labyrinth export --list-targets',
      `  labyrinth export <project-file> --target ${formatExportTargetChoices()} [--out file]`,
      ''
    ].join('\n')
  );
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
