import { readFile } from 'node:fs/promises';

const workflowPath = '.github/workflows/labyrinth-validate.yml';
const workflow = await readFile(workflowPath, 'utf8');

const requiredSnippets = [
  'pnpm install --frozen-lockfile',
  'pnpm lint',
  'pnpm typecheck',
  'pnpm build',
  'pnpm test',
  'pnpm architecture:check',
  'pnpm docs:check',
  'pnpm ci:check',
  'pnpm exec playwright install --with-deps chromium',
  'pnpm e2e',
  'cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml',
  'cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml',
  'node apps/cli/dist/index.js validate',
  'node apps/cli/dist/index.js report',
  'node apps/cli/dist/index.js export',
  'actions/upload-artifact@v4',
  'pnpm release:dry-run'
];

const forbiddenSnippets = [
  'gh release create',
  'softprops/action-gh-release',
  'npx semantic-release',
  'npm publish',
  'pnpm publish',
  'git push'
];

const missing = requiredSnippets.filter((snippet) => !workflow.includes(snippet));
const forbidden = forbiddenSnippets.filter((snippet) => workflow.includes(snippet));

if (missing.length > 0 || forbidden.length > 0) {
  console.error('CI workflow check failed.');

  for (const snippet of missing) {
    console.error(`- Missing required workflow step: ${snippet}`);
  }

  for (const snippet of forbidden) {
    console.error(`- Forbidden publish action in workflow: ${snippet}`);
  }

  process.exit(1);
}

console.log('CI workflow check passed.');
