# CLI And CI

Date: 2026-06-17

## CLI Commands

Build before using the compiled CLI:

```powershell
npx --yes pnpm@11.7.0 build
```

Validate:

```powershell
node apps/cli/dist/index.js validate <project-file-or-package> [--format text|json] [--strict]
```

Report:

```powershell
node apps/cli/dist/index.js report <project-file-or-package> [--format markdown|json] [--out file-or-package]
```

Export:

```powershell
node apps/cli/dist/index.js export <project-file-or-package> --target engine-json [--out file-or-package]
node apps/cli/dist/index.js export --list-targets
```

When `--out` points to a `.lcproj` package, report and export commands write generated files under package artifact directories such as `reports/` and `exports/`. They do not modify `project.json`, and validation still reads only `project.json`.

Exit codes:

- `0`: command completed successfully
- `1`: validation produced error diagnostics, or any diagnostics with `--strict`
- `2`: file read, JSON parse, schema validation, argument, report, export, or IO failure

## CI

The enabled workflow is:

```text
.github/workflows/labyrinth-validate.yml
```

It runs:

- dependency install
- lint
- typecheck
- build
- unit tests
- architecture check
- docs check
- CI workflow guard
- Playwright browser install
- E2E
- cargo fmt/check
- CLI validation/report/export artifact generation
- release dry-run

The workflow uploads CI JSON artifacts and the release dry-run manifest. It does not publish releases, sign installers, or push generated files.
