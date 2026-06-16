# `.lcproj` Package Assets

Date: 2026-06-17

Phase 4 productization keeps a minimal `AssetRef` contract for package-local asset references. This is a reference model, not a file-content model.

## Project Truth

`project.json` remains the only canonical project data in a `.lcproj` package.

Allowed project data:

- `ProjectGraph.assets[]`
- each asset id
- asset kind
- package-relative `packagePath`
- optional label and MIME type

Forbidden project data:

- binary file content
- absolute local paths
- imported cache paths
- generated preview data
- export/report/cache output paths as validation truth

## AssetRef

An `AssetRef` has this shape:

```ts
type AssetRef = {
  id: string;
  kind: 'image' | 'audio' | 'document' | 'other';
  packagePath: string;
  label?: string;
  mimeType?: string;
};
```

`packagePath` must point under `assets/`, for example:

```text
assets/map-sketch.png
assets/audio/door-open.wav
assets/notes/clue-sheet.md
```

Schema validation rejects absolute paths, backslashes, `..` traversal segments, and unknown asset kinds. It does not require the asset file to exist, because schema parsing must stay portable and offline.

## Manifest

A package manifest may inventory `assetRefs` copied from `project.json`, but it cannot override or replace `project.json`.

Manifest responsibilities:

- describe package version
- list package directories
- list generated artifact paths
- copy asset reference inventory for package inspection

Manifest non-responsibilities:

- validation truth
- migration truth
- fallback project recovery
- local path storage
- generated artifact recovery

## Generated Artifacts

These remain regenerable and may be deleted without changing the project truth:

- `exports/`
- `reports/`
- `cache/`

Deleting those directories must not affect opening, parsing, migration, or validation of `project.json`.
