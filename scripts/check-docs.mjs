import { access } from 'node:fs/promises';

const requiredDocs = [
  'AGENTS.md',
  'docs/development-plan.md',
  'docs/phase0-acceptance-review.md',
  'docs/phase0-architecture-implementation.md',
  'docs/phase1-architecture-implementation.md',
  'docs/codex-ops-workflow.md',
  'docs/codex-git-workflow.md'
];

for (const docPath of requiredDocs) {
  await access(docPath);
}

console.log('Docs check passed.');
