import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const rootDir = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sourceRoots = [
  'packages/core/src',
  'packages/schema/src',
  'packages/rulesets/src',
  'packages/exporters/src',
  'packages/test-fixtures/src',
  'packages/workbench/src',
  'packages/editor-ui/src',
  'apps/cli/src',
  'apps/desktop/src',
  'examples',
  'scripts',
  'tests/e2e'
];
const requiredArchitectureFiles = [
  'packages/exporters/src/targets/registry.ts',
  'apps/desktop/src/preferences/preferences.ts',
  'apps/desktop/src-tauri/src/preferences.rs'
];
const forbiddenRemovedPaths = [
  'packages/collaboration-prototype',
  'packages/collaboration-session',
  'docs/collaboration',
  'docs/collaboration-decision-record.md',
  'docs/phase6-architecture-implementation.md',
  'docs/phase6-acceptance-review.md',
  'docs/phase7-architecture-implementation.md'
];
const mainPackageManifests = [
  'package.json',
  'apps/cli/package.json',
  'apps/desktop/package.json',
  'packages/core/package.json',
  'packages/editor-ui/package.json',
  'packages/exporters/package.json',
  'packages/rulesets/package.json',
  'packages/schema/package.json',
  'packages/test-fixtures/package.json',
  'packages/workbench/package.json'
];
const forbiddenMainDependencies = [
  '@labyrinth/collaboration-prototype',
  '@labyrinth/collaboration-session',
  'yjs',
  'y-websocket',
  'y-webrtc'
];
const forbiddenSessionStateFields = [
  'actorId',
  'connectionStatus',
  'cursor',
  'cursors',
  'peer',
  'peerId',
  'peerIds',
  'presence',
  'provider',
  'providerState',
  'providerUrl',
  'retryQueue',
  'room',
  'roomId',
  'session',
  'sessionId',
  'syncClock',
  'yDoc',
  'yjsUpdate',
  'crdtMetadata'
];
const forbiddenProviderImports = ['yjs', 'y-websocket', 'y-webrtc'];
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

function isCollaborationPackageImport(specifier) {
  return (
    specifier === '@labyrinth/collaboration-prototype' ||
    specifier.startsWith('@labyrinth/collaboration-prototype/') ||
    specifier === '@labyrinth/collaboration-session' ||
    specifier.startsWith('@labyrinth/collaboration-session/')
  );
}

function isProviderImport(specifier) {
  return forbiddenProviderImports.includes(specifier);
}

function collectJsonPropertyKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectJsonPropertyKeys(item, keys);
    }

    return keys;
  }

  if (value === null || typeof value !== 'object') {
    return keys;
  }

  if ('properties' in value && value.properties && typeof value.properties === 'object') {
    keys.push(...Object.keys(value.properties));
  }

  for (const child of Object.values(value)) {
    collectJsonPropertyKeys(child, keys);
  }

  return keys;
}

const violations = [];

for (const requiredFile of requiredArchitectureFiles) {
  try {
    await stat(join(rootDir, requiredFile));
  } catch {
    violations.push(`Missing required architecture boundary file: ${requiredFile}`);
  }
}

for (const removedPath of forbiddenRemovedPaths) {
  try {
    await stat(join(rootDir, removedPath));
    violations.push(`Removed collaboration scope path must not be restored: ${removedPath}`);
  } catch {
    // Expected: the removed path should not exist.
  }
}

for (const manifestPath of mainPackageManifests) {
  const manifest = JSON.parse(await readFile(join(rootDir, manifestPath), 'utf8'));
  const dependencySections = [
    manifest.dependencies ?? {},
    manifest.devDependencies ?? {},
    manifest.peerDependencies ?? {},
    manifest.optionalDependencies ?? {}
  ];

  for (const dependencyName of forbiddenMainDependencies) {
    if (dependencySections.some((section) => dependencyName in section)) {
      violations.push(
        `${manifestPath} depends on experimental collaboration dependency "${dependencyName}"`
      );
    }
  }
}

const rootTsconfig = JSON.parse(await readFile(join(rootDir, 'tsconfig.json'), 'utf8'));
const rootReferences = Array.isArray(rootTsconfig.references) ? rootTsconfig.references : [];

if (
  rootReferences.some(
    (reference) =>
      typeof reference?.path === 'string' &&
      reference.path.replaceAll('\\', '/').includes('packages/collaboration-prototype')
  )
) {
  violations.push('Root tsconfig references experimental collaboration prototype');
}

const projectTypeSource = await readFile(join(rootDir, 'packages/schema/src/project.ts'), 'utf8');
const projectJsonSchema = JSON.parse(
  await readFile(join(rootDir, 'packages/schema/src/jsonSchema/project.schema.json'), 'utf8')
);
const schemaPropertyKeys = collectJsonPropertyKeys(projectJsonSchema);

for (const forbiddenField of forbiddenSessionStateFields) {
  const fieldPattern = new RegExp(`\\b${forbiddenField}\\??\\s*:`);

  if (fieldPattern.test(projectTypeSource)) {
    violations.push(`ProjectGraph type includes forbidden session field "${forbiddenField}"`);
  }

  if (schemaPropertyKeys.includes(forbiddenField)) {
    violations.push(`Project JSON schema includes forbidden session field "${forbiddenField}"`);
  }
}

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
        isCollaborationPackageImport(specifier)
      ) {
        violations.push(`${projectPath} imports experimental collaboration package`);
      }

      if (
        (projectPath.startsWith('apps/desktop/') || projectPath.startsWith('apps/cli/')) &&
        (isCollaborationPackageImport(specifier) || isProviderImport(specifier))
      ) {
        violations.push(`${projectPath} imports experimental collaboration dependency`);
      }

      if (
        !projectPath.startsWith('packages/collaboration-prototype/') &&
        isProviderImport(specifier)
      ) {
        violations.push(`${projectPath} imports collaboration provider dependency "${specifier}"`);
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
