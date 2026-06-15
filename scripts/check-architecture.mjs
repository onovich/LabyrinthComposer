import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const rootDir = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sourceRoots = [
  'packages/core/src',
  'packages/schema/src',
  'packages/test-fixtures/src',
  'packages/workbench/src',
  'packages/editor-ui/src',
  'apps/cli/src',
  'apps/desktop/src'
];
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g;
const sourceExtensions = ['.ts', '.tsx'];

function isSourceFile(entryName) {
  return sourceExtensions.some((extension) => entryName.endsWith(extension));
}

async function collectFiles(dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const entry of entries) {
    const absolute = join(dir, entry);
    const entryStat = await stat(absolute);

    if (entryStat.isDirectory()) {
      files.push(...(await collectFiles(absolute)));
    } else if (isSourceFile(entry)) {
      files.push(absolute);
    }
  }

  return files;
}

function toProjectPath(absolutePath) {
  return relative(rootDir, absolutePath).split(sep).join('/');
}

function isForbiddenCoreImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    ['fs', 'path', 'process', 'react', '@labyrinth/cli'].includes(specifier) ||
    specifier === '@labyrinth/workbench' ||
    specifier.startsWith('@labyrinth/workbench/') ||
    specifier === '@labyrinth/editor-ui' ||
    specifier.startsWith('@labyrinth/editor-ui/') ||
    specifier.startsWith('apps/')
  );
}

function isForbiddenSchemaImport(specifier) {
  return (
    specifier === '@labyrinth/core' ||
    specifier.startsWith('@labyrinth/core/') ||
    specifier === '@labyrinth/workbench' ||
    specifier.startsWith('@labyrinth/workbench/') ||
    specifier === '@labyrinth/editor-ui' ||
    specifier.startsWith('@labyrinth/editor-ui/')
  );
}

function isForbiddenWorkbenchImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    ['fs', 'path', 'process', 'react', 'react-dom', '@xyflow/react'].includes(specifier) ||
    specifier.startsWith('@labyrinth/editor-ui') ||
    specifier.startsWith('apps/')
  );
}

function isForbiddenEditorUiImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    ['fs', 'path', 'process'].includes(specifier) ||
    specifier.startsWith('@tauri-apps/') ||
    specifier.startsWith('@labyrinth/desktop') ||
    specifier.startsWith('apps/desktop')
  );
}

const violations = [];

for (const root of sourceRoots) {
  const files = await collectFiles(join(rootDir, root));

  for (const file of files) {
    const projectPath = toProjectPath(file);
    const isTestFile = projectPath.endsWith('.test.ts') || projectPath.endsWith('.test.tsx');
    const content = await readFile(file, 'utf8');
    const imports = [...content.matchAll(importPattern)].map((match) => match[1]);

    for (const specifier of imports) {
      if (
        projectPath.startsWith('packages/core/') &&
        !isTestFile &&
        isForbiddenCoreImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden core dependency "${specifier}"`);
      }

      if (projectPath.startsWith('packages/schema/') && isForbiddenSchemaImport(specifier)) {
        violations.push(`${projectPath} imports forbidden schema dependency "${specifier}"`);
      }

      if (
        projectPath.startsWith('packages/workbench/') &&
        !isTestFile &&
        isForbiddenWorkbenchImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden workbench dependency "${specifier}"`);
      }

      if (
        projectPath.startsWith('packages/editor-ui/') &&
        !isTestFile &&
        isForbiddenEditorUiImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden editor-ui dependency "${specifier}"`);
      }

      if (projectPath.startsWith('packages/') && specifier.startsWith('@labyrinth/cli')) {
        violations.push(`${projectPath} imports CLI from a package`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Architecture check failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Architecture check passed.');
