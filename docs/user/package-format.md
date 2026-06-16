# `.lcproj` Package Format

Date: 2026-06-16

Labyrinth Composer supports plain JSON project files and directory packages.

## Plain File

```text
MyProject.lcproj.json
```

## Package Directory

```text
MyProject.lcproj/
  project.json
  assets/
  exports/
  reports/
  cache/
```

`project.json` is the only canonical project data in a package. It uses the same `ProjectGraph` schema as `.lcproj.json`.

## Generated Directories

These directories are generated or app-managed:

- `exports/`
- `reports/`
- `cache/`

Deleting them must not change project parsing, migration, or validation.

## Assets

Project data may contain `ProjectGraph.assets[]` entries. Each entry is an `AssetRef` with a package-relative path under `assets/`.

Example:

```json
{
  "id": "map-sketch",
  "kind": "image",
  "packagePath": "assets/map-sketch.png",
  "label": "Map sketch",
  "mimeType": "image/png"
}
```

Schema validation rejects absolute paths, backslashes, and `..` traversal segments. It does not require the file to exist.

## CLI Output Into Packages

```powershell
node apps/cli/dist/index.js report MyProject.lcproj --format json --out MyProject.lcproj
node apps/cli/dist/index.js export MyProject.lcproj --target engine-json --out MyProject.lcproj
```

Those commands write generated artifacts into package directories. They do not modify `project.json`.
