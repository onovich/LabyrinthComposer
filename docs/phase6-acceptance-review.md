# Phase 6 Acceptance Review

Date: 2026-06-16

Status: Pass after final local and remote RC gate.

## Scope

Phase 6 productizes the collaboration decision boundary, not the collaboration feature itself. The phase keeps the Yjs experiment isolated while proving that future collaboration must be session state over workbench commands.

## Round Summary

- Round 1: Corrected collaboration decision gate semantics so productization requires presence to stay out of `ProjectGraph`.
  Commit: `621480f fix: clarify collaboration decision gate`
- Round 2: Added `CollaborationCommandEnvelope` for serializable session metadata around existing workbench commands.
  Commit: `e5a40a3 feat: add collaboration command envelope`
- Round 3: Added deterministic replay policy, session-level rejection semantics, and conflict documentation.
  Commit: `2d411fc feat: define collaboration replay policy`
- Round 4: Added provider-neutral adapter and in-memory fake provider tests.
  Commit: `eb0a82f feat: add collaboration provider adapter`
- Round 5/6: Added session-state/privacy policy, ignored app-local collaboration logs, and Phase 6 architecture guards.
  Commit: `d7d03a4 docs: define collaboration session state policy`

## Acceptance Matrix

| Requirement                                                        | Result | Evidence                                                                                          |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------- |
| Decision gate no longer implies presence may enter ProjectGraph    | Pass   | `packages/collaboration-prototype/src/decisionGate.ts`, `decisionGate.test.ts`                    |
| Command envelope keeps actor metadata in session layer             | Pass   | `packages/collaboration-prototype/src/session/commandEnvelope.ts`, `commandEnvelope.test.ts`      |
| Replay is deterministic for a given command log                    | Pass   | `packages/collaboration-prototype/src/session/replayPolicy.ts`, `replayPolicy.test.ts`            |
| Conflict failures become session rejections, not project mutation  | Pass   | `docs/collaboration/conflict-semantics.md`, `replayPolicy.test.ts`                                |
| Provider adapter stays isolated from schema/core/workbench/UI      | Pass   | `packages/collaboration-prototype/src/session/providerAdapter.ts`, `providerAdapter.test.ts`      |
| Session/privacy policy prevents provider state from project files  | Pass   | `docs/collaboration/session-state-policy.md`, `.gitignore`                                        |
| Main packages remain collaboration-free                            | Pass   | `scripts/check-architecture.mjs`                                                                  |
| Productization decision is explicit                                | Pass   | `docs/collaboration/phase6-productization-decision.md`                                            |
| No default Collaboration Lab UI or provider connection is included | Pass   | No desktop import of `@labyrinth/collaboration-prototype` or `yjs`; `architecture:check` enforces |

## Boundary Review

- `ProjectGraph` remains portable domain data.
- `.lcproj/project.json` does not store actor id, room id, provider URL, connection status, presence, cursor, retry queue, or Yjs updates.
- `packages/workbench` still owns command handling and does not depend on collaboration code.
- `packages/collaboration-prototype` consumes workbench command contracts but does not own a canonical project graph.
- Validation, report, export, and release scripts do not read collaboration session logs.
- App-local collaboration session/log directories are ignored and disposable.

## Product Decision

Decision: continue experiment.

Collaboration is now a constrained Phase 7 candidate, but Phase 6 does not enable it in the main desktop path. A future Phase 7 must define provider, identity, permissions, privacy, offline/reconnect behavior, collaborative undo, and explicit opt-in UX before product acceptance.

## Final Verification

Local verification on 2026-06-16:

| Command                                                               | Result                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| `Validate.cmd`                                                        | Pass, 45 test files / 143 tests                         |
| `Smoke.cmd`                                                           | Pass                                                    |
| `npx --yes pnpm@11.7.0 e2e`                                           | Pass, 1 Playwright test                                 |
| `cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml` | Pass                                                    |
| `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`       | Pass                                                    |
| `ReleaseDryRun.cmd`                                                   | Pass, wrote `artifacts/release-candidate/manifest.json` |

Required commands:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
npx --yes pnpm@11.7.0 e2e
cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

GitHub Actions `Labyrinth RC Gate` must pass on the final pushed commit before Phase 6 is considered complete.
