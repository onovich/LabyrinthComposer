import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const rootDir = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sourceRoots = [
  'packages/core/src',
  'packages/schema/src',
  'packages/rulesets/src',
  'packages/exporters/src',
  'packages/collaboration-prototype/src',
  'packages/test-fixtures/src',
  'packages/workbench/src',
  'packages/editor-ui/src',
  'apps/cli/src',
  'apps/desktop/src',
  'examples',
  'scripts',
  'tests/e2e'
];
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g;
const sourceExtensions = ['.ts', '.tsx', '.js', '.mjs', '.cs', '.gd'];

function isSourceFile(entryName) {
  return sourceExtensions.some((extension) => entryName.endsWith(extension));
}

async function collectFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
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
    specifier === '@labyrinth/rulesets' ||
    specifier.startsWith('@labyrinth/rulesets/') ||
    specifier === '@labyrinth/exporters' ||
    specifier.startsWith('@labyrinth/exporters/') ||
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
    specifier === '@labyrinth/rulesets' ||
    specifier.startsWith('@labyrinth/rulesets/') ||
    specifier === '@labyrinth/exporters' ||
    specifier.startsWith('@labyrinth/exporters/') ||
    specifier === '@labyrinth/editor-ui' ||
    specifier.startsWith('@labyrinth/editor-ui/')
  );
}

function isForbiddenRulesetsImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    ['fs', 'path', 'process', 'react', 'react-dom', '@xyflow/react'].includes(specifier) ||
    specifier === '@labyrinth/core' ||
    specifier.startsWith('@labyrinth/core/') ||
    specifier === '@labyrinth/workbench' ||
    specifier.startsWith('@labyrinth/workbench/') ||
    specifier === '@labyrinth/exporters' ||
    specifier.startsWith('@labyrinth/exporters/') ||
    specifier === '@labyrinth/editor-ui' ||
    specifier.startsWith('@labyrinth/editor-ui/') ||
    specifier.startsWith('@tauri-apps/') ||
    specifier.startsWith('apps/')
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

function isForbiddenExportersImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    ['fs', 'path', 'process', 'react', 'react-dom', '@xyflow/react'].includes(specifier) ||
    specifier === '@labyrinth/core' ||
    specifier.startsWith('@labyrinth/core/') ||
    specifier === '@labyrinth/workbench' ||
    specifier.startsWith('@labyrinth/workbench/') ||
    specifier === '@labyrinth/editor-ui' ||
    specifier.startsWith('@labyrinth/editor-ui/') ||
    specifier.startsWith('@tauri-apps/') ||
    specifier.startsWith('apps/')
  );
}

function isForbiddenEditorUiImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    ['fs', 'path', 'process'].includes(specifier) ||
    specifier.startsWith('@tauri-apps/') ||
    specifier === '@labyrinth/core' ||
    specifier.startsWith('@labyrinth/core/') ||
    specifier === '@labyrinth/rulesets' ||
    specifier.startsWith('@labyrinth/rulesets/') ||
    specifier === '@labyrinth/exporters' ||
    specifier.startsWith('@labyrinth/exporters/') ||
    specifier.startsWith('@labyrinth/desktop') ||
    specifier.startsWith('apps/desktop')
  );
}

function isForbiddenCliImport(specifier) {
  return (
    ['react', 'react-dom', '@xyflow/react'].includes(specifier) ||
    specifier.startsWith('@tauri-apps/') ||
    specifier === '@labyrinth/editor-ui' ||
    specifier.startsWith('@labyrinth/editor-ui/') ||
    specifier.startsWith('@labyrinth/desktop') ||
    specifier.startsWith('apps/desktop')
  );
}

function isForbiddenExampleImport(specifier) {
  return specifier === '@labyrinth' || specifier.startsWith('@labyrinth/');
}

function isForbiddenCollaborationImport(specifier) {
  return (
    specifier.startsWith('node:') ||
    ['fs', 'path', 'process', 'react', 'react-dom', '@xyflow/react'].includes(specifier) ||
    specifier === '@labyrinth/core' ||
    specifier.startsWith('@labyrinth/core/') ||
    specifier === '@labyrinth/rulesets' ||
    specifier.startsWith('@labyrinth/rulesets/') ||
    specifier === '@labyrinth/exporters' ||
    specifier.startsWith('@labyrinth/exporters/') ||
    specifier === '@labyrinth/editor-ui' ||
    specifier.startsWith('@labyrinth/editor-ui/') ||
    specifier.startsWith('@tauri-apps/') ||
    specifier.startsWith('apps/')
  );
}

function isForbiddenE2eImport(specifier) {
  return specifier !== '@playwright/test';
}

const violations = [];

for (const root of sourceRoots) {
  const files = await collectFiles(join(rootDir, root));

  for (const file of files) {
    const projectPath = toProjectPath(file);
    const isTestFile =
      projectPath.endsWith('.test.ts') ||
      projectPath.endsWith('.test.tsx') ||
      projectPath.endsWith('.test.mjs') ||
      projectPath.endsWith('.test.js');
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
        projectPath.startsWith('packages/rulesets/') &&
        !isTestFile &&
        isForbiddenRulesetsImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden rulesets dependency "${specifier}"`);
      }

      if (
        projectPath.startsWith('packages/workbench/') &&
        !isTestFile &&
        isForbiddenWorkbenchImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden workbench dependency "${specifier}"`);
      }

      if (
        projectPath.startsWith('packages/exporters/') &&
        !isTestFile &&
        isForbiddenExportersImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden exporters dependency "${specifier}"`);
      }

      if (
        projectPath.startsWith('packages/editor-ui/') &&
        !isTestFile &&
        isForbiddenEditorUiImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden editor-ui dependency "${specifier}"`);
      }

      if (projectPath.startsWith('apps/cli/') && !isTestFile && isForbiddenCliImport(specifier)) {
        violations.push(`${projectPath} imports forbidden CLI dependency "${specifier}"`);
      }

      if (projectPath.startsWith('examples/') && isForbiddenExampleImport(specifier)) {
        violations.push(`${projectPath} imports forbidden example dependency "${specifier}"`);
      }

      if (
        projectPath.startsWith('packages/collaboration-prototype/') &&
        !isTestFile &&
        isForbiddenCollaborationImport(specifier)
      ) {
        violations.push(`${projectPath} imports forbidden collaboration dependency "${specifier}"`);
      }

      if (projectPath.startsWith('tests/e2e/') && isForbiddenE2eImport(specifier)) {
        violations.push(`${projectPath} imports forbidden e2e dependency "${specifier}"`);
      }

      if (
        projectPath.startsWith('scripts/release-') &&
        !isTestFile &&
        (specifier === '@labyrinth/schema' ||
          specifier.startsWith('@labyrinth/schema/') ||
          specifier === '@labyrinth/core' ||
          specifier.startsWith('@labyrinth/core/') ||
          specifier === '@labyrinth/rulesets' ||
          specifier.startsWith('@labyrinth/rulesets/') ||
          specifier === '@labyrinth/exporters' ||
          specifier.startsWith('@labyrinth/exporters/') ||
          specifier === '@labyrinth/workbench' ||
          specifier.startsWith('@labyrinth/workbench/') ||
          specifier === '@labyrinth/editor-ui' ||
          specifier.startsWith('@labyrinth/editor-ui/'))
      ) {
        violations.push(`${projectPath} imports domain package from release script "${specifier}"`);
      }

      if (
        projectPath.startsWith('packages/') &&
        !projectPath.startsWith('packages/collaboration-prototype/') &&
        (specifier === '@labyrinth/collaboration-prototype' ||
          specifier.startsWith('@labyrinth/collaboration-prototype/'))
      ) {
        violations.push(`${projectPath} imports experimental collaboration package`);
      }

      if (projectPath.startsWith('packages/') && specifier.startsWith('@labyrinth/cli')) {
        violations.push(`${projectPath} imports CLI from a package`);
      }
    }

    if (projectPath.startsWith('examples/') && content.includes('@labyrinth/')) {
      violations.push(`${projectPath} references a workspace package from an example`);
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
