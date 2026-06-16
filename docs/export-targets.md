# Export Targets

Date: 2026-06-16

Phase 5 centralizes export targets in `@labyrinth/exporters`.

The registry is the single place that describes:

- target id
- display label
- media type
- package artifact kind
- package artifact path
- pure generation function

Current implemented target:

| Target        | Package artifact             | Notes                                             |
| ------------- | ---------------------------- | ------------------------------------------------- |
| `engine-json` | `exports/engine-export.json` | Stable DTO from project, validation, and ruleset. |

Targets are generated artifacts. They must not add fields back into `ProjectGraph`, and target-specific DTOs must stay inside `packages/exporters`.

Host layers own IO:

- CLI reads project files and writes output files.
- Desktop reads/writes through desktop adapters.
- Exporters only transform data already passed into them.

Unsupported targets return stable CLI errors that include the available target ids. Listing targets is available with:

```powershell
node apps/cli/dist/index.js export --list-targets
```
