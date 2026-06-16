import { spawn } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

function fromRoot(path) {
  return join(rootDir, path);
}

async function assertPathExists(path, label) {
  try {
    await access(path);
  } catch {
    throw new Error(`${label} is missing: ${path}`);
  }
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise(stdout);
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with ${code}: ${stderr}`));
    });
  });
}

async function assertIgnored(path) {
  await run('git', ['check-ignore', path]);
}

async function main() {
  const desktopDist = fromRoot('apps/desktop/dist');
  const desktopAssets = join(desktopDist, 'assets');
  const indexPath = join(desktopDist, 'index.html');
  const tauriConfigPath = fromRoot('apps/desktop/src-tauri/tauri.conf.json');
  const tauriConfig = JSON.parse(await readFile(tauriConfigPath, 'utf8'));
  const frontendDist = resolve(fromRoot('apps/desktop/src-tauri'), tauriConfig.build.frontendDist);

  await assertPathExists(indexPath, 'Desktop index');
  await assertPathExists(desktopAssets, 'Desktop assets directory');

  if (frontendDist !== desktopDist) {
    throw new Error(`Tauri frontendDist points to ${frontendDist}, expected ${desktopDist}`);
  }

  const indexHtml = await readFile(indexPath, 'utf8');
  const assets = await readdir(desktopAssets);

  if (!indexHtml.includes('<div id="root"></div>')) {
    throw new Error('Desktop index is missing the React root element.');
  }

  if (!assets.some((asset) => asset.endsWith('.js'))) {
    throw new Error('Desktop bundle has no JavaScript asset.');
  }

  if (!assets.some((asset) => asset.endsWith('.css'))) {
    throw new Error('Desktop bundle has no CSS asset.');
  }

  const trackedArtifacts = (
    await run('git', [
      'ls-files',
      'apps/desktop/dist',
      'apps/desktop/src-tauri/gen',
      'apps/desktop/src-tauri/target'
    ])
  ).trim();

  if (trackedArtifacts.length > 0) {
    throw new Error(`Build artifacts are tracked by git:\n${trackedArtifacts}`);
  }

  await assertIgnored('apps/desktop/dist');
  await assertIgnored('apps/desktop/src-tauri/gen');
  await assertIgnored('apps/desktop/src-tauri/target');

  console.log(
    'Release dry-run passed: desktop bundle is present, Tauri points to it, and generated artifacts are untracked/ignored.'
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
