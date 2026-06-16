# Phase 5 Acceptance Review

Date: 2026-06-16

Status: Pass after final RC gate.

## Scope

Phase 5 hardened the project for Release Candidate validation without changing project truth semantics.

## Acceptance Matrix

| Area                        | Status | Evidence                                                                             |
| --------------------------- | ------ | ------------------------------------------------------------------------------------ |
| CI workflow                 | Pass   | `.github/workflows/labyrinth-validate.yml`, `scripts/check-ci-workflow.mjs`          |
| RC dry-run                  | Pass   | `scripts/release-dry-run.mjs`, `docs/release/rc-checklist.md`                        |
| Release artifact policy     | Pass   | `docs/release/artifact-policy.md`, ignored `artifacts/`                              |
| Package manifest and assets | Pass   | `packages/schema/src/assets.ts`, `docs/lcproj-package-assets.md`                     |
| Export target registry      | Pass   | `packages/exporters/src/targets/registry.ts`, CLI `--list-targets`                   |
| App-local preferences/logs  | Pass   | `apps/desktop/src/preferences/`, `apps/desktop/src-tauri/src/preferences.rs`         |
| Collaboration decision gate | Pass   | `docs/collaboration-decision-record.md`, architecture guard                          |
| User docs                   | Pass   | `docs/user/getting-started.md`, `docs/user/cli-ci.md`, `docs/user/package-format.md` |

## Boundary Checks

- `ProjectGraph` does not store recent files, app-local logs, window state, release data, or collaboration provider state.
- `.lcproj/project.json` remains canonical package data.
- Generated exports, reports, cache, and release artifacts remain disposable.
- CI and release dry-run call repository scripts and CLI rather than reimplementing domain behavior.
- Collaboration prototype remains isolated from the main app path.

## Final Verification

Local verification on 2026-06-16:

| Command                                                               | Result                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| `Validate.cmd`                                                        | Pass, 42 test files / 128 tests                         |
| `Smoke.cmd`                                                           | Pass                                                    |
| `npx --yes pnpm@11.7.0 e2e`                                           | Pass, 1 Playwright test                                 |
| `cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml` | Pass                                                    |
| `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`       | Pass                                                    |
| `ReleaseDryRun.cmd`                                                   | Pass, wrote `artifacts/release-candidate/manifest.json` |

Required commands:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
npx --yes pnpm@11.7.0 e2e
cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```
