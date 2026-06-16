# CI Example

`labyrinth-validate.yml.example` is intentionally committed as an example workflow, not an enabled workflow.

Recommended CI commands:

```powershell
node apps/cli/dist/index.js validate packages/test-fixtures/samples/horror-clinic.lcproj.json --strict --format json
node apps/cli/dist/index.js report packages/test-fixtures/samples/horror-clinic.lcproj.json --format json --out artifacts-report.json
node apps/cli/dist/index.js export packages/test-fixtures/samples/horror-clinic.lcproj.json --target engine-json --out artifacts-engine-export.json
```

Exit codes:

- `0`: validation/report/export completed and accepted.
- `1`: project JSON and schema are valid, but validation failed under strict mode.
- `2`: file read, JSON parse, schema validation, argument, or export IO error.
