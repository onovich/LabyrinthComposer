import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  isLcprojPackagePath,
  LCPROJ_CANONICAL_PROJECT_FILE,
  LCPROJ_PACKAGE_ARTIFACTS,
  LCPROJ_PACKAGE_DIRECTORIES,
  type LcprojPackageArtifactKind
} from '@labyrinth/schema';

export type ProjectSourceText = {
  text: string;
  inputPath: string;
  canonicalPath: string;
  packagePath?: string;
};

export async function readProjectSourceText(projectPath: string): Promise<ProjectSourceText> {
  const projectStat = await stat(projectPath);

  if (!projectStat.isDirectory()) {
    return {
      text: await readFile(projectPath, 'utf8'),
      inputPath: projectPath,
      canonicalPath: projectPath
    };
  }

  if (!isLcprojPackagePath(projectPath)) {
    throw new Error('Directory project sources must use the .lcproj package extension.');
  }

  const canonicalPath = join(projectPath, LCPROJ_CANONICAL_PROJECT_FILE);

  return {
    text: await readFile(canonicalPath, 'utf8'),
    inputPath: projectPath,
    canonicalPath,
    packagePath: projectPath
  };
}

async function ensurePackageDirectories(packagePath: string): Promise<void> {
  for (const directory of LCPROJ_PACKAGE_DIRECTORIES) {
    await mkdir(join(packagePath, directory), {
      recursive: true
    });
  }
}

async function resolveOutputPath(
  outputPath: string,
  artifactKind: LcprojPackageArtifactKind
): Promise<string> {
  let outputStat: Awaited<ReturnType<typeof stat>> | undefined;

  try {
    outputStat = await stat(outputPath);
  } catch {
    outputStat = undefined;
  }

  if (outputStat?.isDirectory() === true || isLcprojPackagePath(outputPath)) {
    await ensurePackageDirectories(outputPath);
    return join(outputPath, ...LCPROJ_PACKAGE_ARTIFACTS[artifactKind].path);
  }

  return outputPath;
}

export async function writeOutputText(
  outputPath: string,
  artifactKind: LcprojPackageArtifactKind,
  text: string
): Promise<string> {
  const resolvedPath = await resolveOutputPath(outputPath, artifactKind);

  await mkdir(dirname(resolvedPath), {
    recursive: true
  });
  await writeFile(resolvedPath, text, 'utf8');

  return resolvedPath;
}
