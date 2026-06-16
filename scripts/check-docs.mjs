import { access } from 'node:fs/promises';

const requiredDocs = [
  '.github/workflows/labyrinth-validate.yml',
  '.github/workflows/labyrinth-validate.yml.example',
  'AGENTS.md',
  'docs/development-plan.md',
  'docs/product-scope-confirmation.md',
  'docs/roadmap-status-and-next-phase.md',
  'docs/phase4-productization-execution-plan.md',
  'docs/phase0-acceptance-review.md',
  'docs/phase0-architecture-implementation.md',
  'docs/phase1-acceptance-review.md',
  'docs/phase1-architecture-implementation.md',
  'docs/phase2-acceptance-review.md',
  'docs/phase2-architecture-implementation.md',
  'docs/phase3-acceptance-review.md',
  'docs/phase3-architecture-implementation.md',
  'docs/phase4-acceptance-review.md',
  'docs/phase4-architecture-implementation.md',
  'docs/phase4-productization-acceptance-review.md',
  'docs/phase5-acceptance-review.md',
  'docs/phase5-architecture-implementation.md',
  'docs/app-local-preferences.md',
  'docs/export-targets.md',
  'docs/lcproj-package-assets.md',
  'docs/release/artifact-policy.md',
  'docs/release/phase5-release-notes.md',
  'docs/release/rc-checklist.md',
  'docs/user/cli-ci.md',
  'docs/user/getting-started.md',
  'docs/user/package-format.md',
  'docs/Labyrinth_Composer_UI_UX_设计文档_v0.1.pdf',
  'docs/codex-ops-workflow.md',
  'docs/codex-git-workflow.md'
];

for (const docPath of requiredDocs) {
  await access(docPath);
}

console.log('Docs check passed.');
