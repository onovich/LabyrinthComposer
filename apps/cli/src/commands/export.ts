import {
  findExportTarget,
  formatExportTargetChoices,
  formatExportTargetList,
  type ExportTarget
} from '@labyrinth/exporters';
import { parseProjectGraph } from '@labyrinth/schema';
import { createValidationComposition } from '@labyrinth/workbench';

import { readProjectSourceText, writeOutputText } from '../projectSource.js';
import type { CliIo } from './validate.js';

type ExportArgs =
  | {
      mode: 'list-targets';
    }
  | {
      mode: 'generate';
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
    '  labyrinth export --list-targets',
    `  labyrinth export <project-file> --target ${formatExportTargetChoices()} [--out file]`,
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
  let listTargets = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--list-targets') {
      listTargets = true;
      continue;
    }

    if (arg === '--target') {
      const next = args[index + 1];

      if (next === undefined || next.startsWith('-')) {
        return {
          ok: false,
          message: '--target requires an export target id.'
        };
      }

      const exportTarget = findExportTarget(next);

      if (exportTarget === undefined) {
        return {
          ok: false,
          message: `Unsupported export target: ${next}. Available targets: ${formatExportTargetChoices()}.`
        };
      }

      target = exportTarget;
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

  if (listTargets) {
    if (projectFile !== undefined || target !== undefined || outFile !== undefined) {
      return {
        ok: false,
        message: '--list-targets cannot be combined with project files, --target, or --out.'
      };
    }

    return {
      ok: true,
      args: {
        mode: 'list-targets'
      }
    };
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
      mode: 'generate',
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

  if (parsedArgs.args.mode === 'list-targets') {
    io.stdout.write(`${formatExportTargetList()}\n`);
    return 0;
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
  const text = parsedArgs.args.target.generate({
    project: parsedProject.project,
    validation,
    rulePreset
  });

  if (parsedArgs.args.outFile !== undefined) {
    try {
      await writeOutputText(
        parsedArgs.args.outFile,
        parsedArgs.args.target.packageArtifactKind,
        text
      );
    } catch (error) {
      io.stderr.write(`Failed to write "${parsedArgs.args.outFile}": ${String(error)}\n`);
      return 2;
    }
  } else {
    io.stdout.write(text);
  }

  return 0;
}
