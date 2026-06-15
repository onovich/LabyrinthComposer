import { readFile } from 'node:fs/promises';

import { validateProject } from '@labyrinth/core';
import { parseProjectGraph } from '@labyrinth/schema';

import { formatJson } from '../formatters/jsonFormatter.js';
import { formatText } from '../formatters/textFormatter.js';

type OutputFormat = 'json' | 'text';

export type CliIo = {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
};

type ValidateArgs = {
  projectFile: string;
  format: OutputFormat;
  strict: boolean;
};

type ParseArgsResult =
  | {
      ok: true;
      args: ValidateArgs;
    }
  | {
      ok: false;
      message: string;
    };

function usage(): string {
  return [
    'Usage:',
    '  labyrinth validate <project-file> [--format text|json] [--strict]',
    '',
    'Exit codes:',
    '  0  no error diagnostics',
    '  1  error diagnostics, or any diagnostic when --strict is set',
    '  2  file read, JSON parse, schema validation, or argument error'
  ].join('\n');
}

function parseValidateArgs(args: string[]): ParseArgsResult {
  let format: OutputFormat = 'text';
  let strict = false;
  let projectFile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--format') {
      const next = args[index + 1];

      if (next !== 'text' && next !== 'json') {
        return {
          ok: false,
          message: '--format must be either "text" or "json".'
        };
      }

      format = next;
      index += 1;
      continue;
    }

    if (arg === '--strict') {
      strict = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      return {
        ok: false,
        message: usage()
      };
    }

    if (arg?.startsWith('-') === true) {
      return {
        ok: false,
        message: `Unknown option: ${arg}`
      };
    }

    if (projectFile !== undefined) {
      return {
        ok: false,
        message: `Unexpected argument: ${arg}`
      };
    }

    projectFile = arg;
  }

  if (projectFile === undefined) {
    return {
      ok: false,
      message: `Missing project file.\n\n${usage()}`
    };
  }

  return {
    ok: true,
    args: {
      projectFile,
      format,
      strict
    }
  };
}

function hasExitFailure(strict: boolean, diagnostics: Array<{ severity: string }>): boolean {
  return (
    diagnostics.some((diagnostic) => diagnostic.severity === 'error') ||
    (strict && diagnostics.length > 0)
  );
}

export async function runValidate(rawArgs: string[], io: CliIo): Promise<number> {
  const parsedArgs = parseValidateArgs(rawArgs);

  if (!parsedArgs.ok) {
    io.stderr.write(`${parsedArgs.message}\n`);
    return 2;
  }

  let raw: string;

  try {
    raw = await readFile(parsedArgs.args.projectFile, 'utf8');
  } catch (error) {
    io.stderr.write(`Failed to read "${parsedArgs.args.projectFile}": ${String(error)}\n`);
    return 2;
  }

  let value: unknown;

  try {
    value = JSON.parse(raw) as unknown;
  } catch (error) {
    io.stderr.write(`Failed to parse JSON "${parsedArgs.args.projectFile}": ${String(error)}\n`);
    return 2;
  }

  const parsedProject = parseProjectGraph(value);

  if (!parsedProject.ok) {
    io.stderr.write(`Schema validation failed for "${parsedArgs.args.projectFile}":\n`);
    for (const issue of parsedProject.issues) {
      io.stderr.write(`- ${issue.path}: ${issue.message}\n`);
    }
    return 2;
  }

  const result = validateProject(parsedProject.project);
  io.stdout.write(parsedArgs.args.format === 'json' ? formatJson(result) : formatText(result));

  return hasExitFailure(parsedArgs.args.strict, result.diagnostics) ? 1 : 0;
}
