import { createEngineExport, formatEngineExportJson } from '@labyrinth/exporters';
import { parseProjectGraph } from '@labyrinth/schema';
import { createValidationComposition } from '@labyrinth/workbench';

import { readProjectSourceText, writeOutputText } from '../projectSource.js';
import type { CliIo } from './validate.js';

type ExportTarget = 'engine-json';

type ExportArgs = {
  projectFile: string;
  target: ExportTarget;
  outFile?: string;
};

type ParseArgsResult =
  | {
      ok: true;
      args: ExportArgs;
    }
  | {
      ok: false;
      message: string;
    };

function usage(): string {
  return [
    'Usage:',
    '  labyrinth export <project-file> --target engine-json [--out file]',
    '',
    'Exit codes:',
    '  0  export generated',
    '  2  file read, JSON parse, schema validation, argument, or export IO error'
  ].join('\n');
}

function parseExportArgs(args: string[]): ParseArgsResult {
  let target: ExportTarget | undefined;
  let outFile: string | undefined;
  let projectFile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--target') {
      const next = args[index + 1];

      if (next !== 'engine-json') {
        return {
          ok: false,
          message: '--target must be "engine-json".'
        };
      }

      target = next;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const next = args[index + 1];

      if (next === undefined || next.startsWith('-')) {
        return {
          ok: false,
          message: '--out requires a file path.'
        };
      }

      outFile = next;
      index += 1;
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

  if (target === undefined) {
    return {
      ok: false,
      message: `Missing --target.\n\n${usage()}`
    };
  }

  return {
    ok: true,
    args: {
      projectFile,
      target,
      outFile
    }
  };
}

export async function runExport(rawArgs: string[], io: CliIo): Promise<number> {
  const parsedArgs = parseExportArgs(rawArgs);

  if (!parsedArgs.ok) {
    io.stderr.write(`${parsedArgs.message}\n`);
    return 2;
  }

  let source: Awaited<ReturnType<typeof readProjectSourceText>>;

  try {
    source = await readProjectSourceText(parsedArgs.args.projectFile);
  } catch (error) {
    io.stderr.write(`Failed to read "${parsedArgs.args.projectFile}": ${String(error)}\n`);
    return 2;
  }

  let value: unknown;

  try {
    value = JSON.parse(source.text) as unknown;
  } catch (error) {
    io.stderr.write(`Failed to parse JSON "${source.canonicalPath}": ${String(error)}\n`);
    return 2;
  }

  const parsedProject = parseProjectGraph(value);

  if (!parsedProject.ok) {
    io.stderr.write(`Schema validation failed for "${source.canonicalPath}":\n`);
    for (const issue of parsedProject.issues) {
      io.stderr.write(`- ${issue.path}: ${issue.message}\n`);
    }
    return 2;
  }

  const { rulePreset, validation } = createValidationComposition(parsedProject.project);
  const text = formatEngineExportJson(
    createEngineExport(parsedProject.project, validation, rulePreset)
  );

  if (parsedArgs.args.outFile !== undefined) {
    try {
      await writeOutputText(parsedArgs.args.outFile, 'engineExport', text);
    } catch (error) {
      io.stderr.write(`Failed to write "${parsedArgs.args.outFile}": ${String(error)}\n`);
      return 2;
    }
  } else {
    io.stdout.write(text);
  }

  return 0;
}
