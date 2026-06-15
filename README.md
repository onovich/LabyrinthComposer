# Labyrinth Composer

Phase 0 establishes the local-first domain core for spatial puzzle validation.

## Commands

```powershell
npx --yes pnpm@11.7.0 install
npx --yes pnpm@11.7.0 lint
npx --yes pnpm@11.7.0 typecheck
npx --yes pnpm@11.7.0 build
npx --yes pnpm@11.7.0 test
npx --yes pnpm@11.7.0 labyrinth validate packages/test-fixtures/samples/horror-clinic.lcproj.json --format text
```

The CLI exit codes are:

- `0`: no error diagnostics.
- `1`: error diagnostics, or any diagnostic when `--strict` is set.
- `2`: file read, JSON parse, schema validation, or argument failure.

## Phase 0 Boundaries

- `packages/schema` owns v0 types, JSON Schema, parsing, and migration entry points.
- `packages/core` owns pure validation algorithms and diagnostics.
- `packages/test-fixtures` stores samples and regression cases.
- `apps/cli` reads files, calls schema/core, formats output, and sets exit codes.

Phase 0 intentionally does not include UI, Tauri, SQLite, cloud sync, AI generation, or engine plugins.
