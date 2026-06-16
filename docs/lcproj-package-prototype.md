# `.lcproj` Package Prototype

Phase 3 keeps `.lcproj.json` as the stable main path while proving a directory package shape for teams that want generated artifacts next to the project.

## Layout

```text
MyProject.lcproj/
  project.json
  exports/
    engine-export.json
    report.md
  reports/
    latest-report.json
  assets/
    README.md
  cache/
    layout-cache.json
```

`project.json` is the only canonical project file. It contains the same `ProjectGraph` schema as `.lcproj.json`.

`exports/`, `reports/`, and `cache/` are generated or regenerable. They must not be used as validation input, migration source data, or the next saved project truth.

`assets/` is opaque in Phase 3. Asset files do not participate in validation unless a future schema version adds explicit asset references.

## Prototype Behavior

- CLI project inputs may point at either `sample.lcproj.json` or `Sample.lcproj/`.
- When the input is a package directory, the CLI reads only `Sample.lcproj/project.json`.
- `labyrinth report --format json --out Sample.lcproj` writes `reports/latest-report.json`.
- `labyrinth report --format markdown --out Sample.lcproj` writes `exports/report.md`.
- `labyrinth export --target engine-json --out Sample.lcproj` writes `exports/engine-export.json`.
- The package artifact directories are created on demand.

## Migration Risks

- Older tools may treat `.lcproj` as a file extension rather than a directory package.
- Generated artifacts can become stale; consumers must treat `project.json` as the source and regenerate artifacts when needed.
- Asset references are intentionally not part of the Phase 3 schema, so moving assets into the package does not make them validated data.
- Package cache contents must remain disposable.
