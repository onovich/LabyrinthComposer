# CI Usage

The enabled workflow is `.github/workflows/labyrinth-validate.yml`.

`labyrinth-validate.yml.example` remains as a readable template for downstream projects.

Recommended CI commands:

```powershell
node apps/cli/dist/index.js validate packages/test-fixtures/samples/horror-clinic.lcproj.json --strict --format json
node apps/cli/dist/index.js report packages/test-fixtures/samples/horror-clinic.lcproj.json --format json --out artifacts-report.json
node apps/cli/dist/index.js export packages/test-fixtures/samples/horror-clinic.lcproj.json --target engine-json --out artifacts-engine-export.json
node scripts/release-dry-run.mjs
```

Exit codes:

- `0`: validation/report/export completed and accepted.
- `1`: project JSON and schema are valid, but validation failed under strict mode.
- `2`: file read, JSON parse, schema validation, argument, or export IO error.
