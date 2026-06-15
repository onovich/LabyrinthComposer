#!/usr/bin/env node

import { runValidate } from './commands/validate.js';

async function main(args: string[]): Promise<number> {
  const command = args[0];

  if (command === 'validate') {
    return runValidate(args.slice(1), {
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  process.stderr.write(
    'Usage:\n  labyrinth validate <project-file> [--format text|json] [--strict]\n'
  );
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
