# Release Candidate Checklist

Date: 2026-06-16

Use this checklist for local RC verification. It validates release readiness and produces inspectable artifacts, but it does not publish anything.

## Required Gate

Run:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

The wrapper runs:

- `Validate.cmd`
- `Smoke.cmd`
- `pnpm e2e`
- `cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `pnpm release:dry-run`

## Expected Local Outputs

The dry-run writes:

```text
artifacts/release-candidate/manifest.json
```

That manifest must show:

- `dryRun: true`
- `publish.enabled: false`
- `signing.enabled: false`
- a base artifact name containing product, version, platform, architecture, and commit
- `desktop.dist` matching `apps/desktop/dist`
- `desktop.frontendDist` matching the Tauri config

## Git Hygiene

After the gate:

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
```

Expected:

- tracked source/docs/config changes only when deliberately edited
- no tracked `artifacts/`, `dist/`, `target/`, or Playwright result output

## CI Equivalence

The real workflow at `.github/workflows/labyrinth-validate.yml` mirrors the RC gate with:

- install dependencies
- lint/typecheck/build/test
- architecture/docs/CI workflow guard
- Playwright browser install
- E2E
- cargo fmt/check
- CLI validation/report/export artifacts
- release dry-run
- artifact upload

The workflow is a gate only. It must not create a release or publish artifacts outside workflow storage.
