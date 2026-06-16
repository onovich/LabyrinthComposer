# Release Artifact Policy

Date: 2026-06-17

This policy defines Release Candidate artifacts for Labyrinth Composer. It does not authorize publishing, signing, store upload, or GitHub Release creation.

## Artifact Naming

Release Candidate artifact names use this shape:

```text
<ProductName>-<Version>-<Platform>-<Arch>-<Commit>
```

Example:

```text
Labyrinth-Composer-0.1.0-windows-x64-a3fc597
```

The local release dry-run writes a manifest to:

```text
artifacts/release-candidate/manifest.json
```

The manifest records:

- product name and version
- platform and CPU architecture
- current commit
- desktop bundle path
- Tauri `frontendDist`
- asset count
- publish disabled
- signing disabled

## Uploadable Artifacts

CI may upload these as workflow artifacts:

- `artifacts/ci/*.json`
- `artifacts/release-candidate/manifest.json`
- `apps/desktop/dist/**`
- Playwright failure traces under `test-results/**`
- future unsigned installer or portable package outputs, only when they are generated under an ignored artifact directory

## Never Commit

These paths are generated and must stay out of git:

- `artifacts/`
- `apps/desktop/dist/`
- `apps/desktop/src-tauri/gen/`
- `apps/desktop/src-tauri/target/`
- `playwright-report/`
- `test-results/`

## Signing And Publishing

Signing and publishing are explicit future release-stage actions. Phase 4 productization gates must not:

- create a GitHub Release
- upload to a store, Steam, CDN, or network share
- use a real signing certificate
- push generated artifacts back to the repository

If real publishing is needed, open a separate release phase with explicit user approval for target, version, certificate, retention, and rollback policy.
