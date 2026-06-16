# Getting Started

Date: 2026-06-17

## Install

```powershell
npx --yes pnpm@11.7.0 install
```

## Run The Desktop App

```powershell
npx --yes pnpm@11.7.0 dev:desktop
```

The first screen is the project dashboard. You can start from a template or open an existing `.lcproj.json` / `.lcproj` package.

Recent files are local desktop preferences. They are shown on the dashboard after opening or saving a project, but they are not written into project data.

## Edit A Project

After loading a template, use the left Outline to select project entities:

- Spaces
- Connections
- Gates
- Tokens
- Puzzles
- Beats

The inspector edits the selected entity. The Self Review panel stores personal notes for the selected entity; it is local project data for solo design review, not an online review workflow.

## Validate A Project

```powershell
npx --yes pnpm@11.7.0 build
node apps/cli/dist/index.js validate packages/test-fixtures/samples/horror-clinic.lcproj.json --format text
```

## Export

```powershell
node apps/cli/dist/index.js export packages/test-fixtures/samples/horror-clinic.lcproj.json --target engine-json --out engine-export.json
```

To list export targets:

```powershell
node apps/cli/dist/index.js export --list-targets
```

## Release Candidate Check

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

The release dry-run validates the repository and writes `artifacts/release-candidate/manifest.json`. It does not publish or sign anything.
