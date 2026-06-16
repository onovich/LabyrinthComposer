# Phase 5 Release Notes Draft

Date: 2026-06-16

## Highlights

- Enabled a real GitHub Actions validation workflow.
- Added release dry-run manifest generation for RC artifact inspection.
- Defined `.lcproj` package asset references with portable `AssetRef` paths.
- Added exporter target registry and `labyrinth export --list-targets`.
- Added app-local desktop preferences, recent files, and log storage.
- Kept collaboration as an explicit decision gate outside the main product path.

## Compatibility

- Existing `.lcproj.json` files remain supported.
- `.lcproj/project.json` remains the only canonical project file inside package directories.
- `engine-json` export output remains compatible with the existing stable DTO.
- Recent files and desktop logs are local app state and are not project data.

## RC Gate

Use:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

The gate validates, smokes, runs E2E, checks Rust formatting/buildability, and writes `artifacts/release-candidate/manifest.json`.

Publishing, signing, and installer distribution remain disabled.
