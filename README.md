# Labyrinth Composer

Labyrinth Composer is a local-first, single-user tool for indie game developers designing spatial puzzle graphs, validating reachability and progression rules, keeping self-review notes, and exporting engine-facing artifacts.

## Commands

```powershell
npx --yes pnpm@11.7.0 install
npx --yes pnpm@11.7.0 lint
npx --yes pnpm@11.7.0 typecheck
npx --yes pnpm@11.7.0 build
npx --yes pnpm@11.7.0 test
npx --yes pnpm@11.7.0 labyrinth validate packages/test-fixtures/samples/horror-clinic.lcproj.json --format text
```

Useful release gate:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

The CLI exit codes are:

- `0`: no error diagnostics.
- `1`: error diagnostics, or any diagnostic when `--strict` is set.
- `2`: file read, JSON parse, schema validation, argument, report, export, or IO failure.

## Current Boundaries

- `packages/schema` owns v0 types, JSON Schema, parsing, and migration entry points.
- `packages/core` owns pure validation algorithms and diagnostics.
- `packages/rulesets` owns rule presets.
- `packages/exporters` owns pure report/export DTO generation.
- `packages/workbench` owns editor state, command handling, validation composition, and view models.
- `packages/editor-ui` owns React UI components.
- `packages/test-fixtures` stores samples and regression cases.
- `apps/cli` reads/writes files, calls packages, formats output, and sets exit codes.
- `apps/desktop` owns Tauri/browser host adapters, app-local preferences, recent files, and logs.

Project truth stays in `.lcproj/project.json` or `.lcproj.json`. Generated reports, exports, cache files, release artifacts, and app-local preferences are outside project truth.

Product scope is solo and local-first: no real-time collaboration, cloud sync, accounts, permissions, telemetry, or team workspace features are part of the current plan.

Start here:

- `docs/user/getting-started.md`
- `docs/user/cli-ci.md`
- `docs/user/package-format.md`
- `docs/release/rc-checklist.md`
