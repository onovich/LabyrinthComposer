# Phase 7 Architecture Implementation Plan

Date: 2026-06-17

Project: Labyrinth Composer

Target phase: Phase 7 - Collaboration Productization Candidate and Replay Convergence

Prerequisite: Phase 6 has passed local and remote RC gates. Collaboration remains an experiment, not a default product feature.

## 1. Phase Goal

Phase 7 is not the phase for enabling real-time multiplayer by default.

Phase 7 should turn the Phase 6 collaboration boundary into a safe productization candidate by doing three things:

1. Collapse all collaboration replay paths into one canonical replay policy.
2. Add the minimum provider, identity, permission, privacy, undo, and opt-in UX decisions needed for a controlled Collaboration Lab.
3. Strengthen architecture guards so collaboration cannot leak into `ProjectGraph`, schema, core, workbench, editor-ui, exports, reports, or package files.

One sentence rule:

```text
Collaboration may become an opt-in session feature, but ProjectGraph remains the only portable project truth.
```

## 2. Current Phase 6 Carry-Over Risk

The Phase 6 acceptance review passed, but it left one non-blocking architectural recommendation that must become the first Phase 7 task.

Current risk:

- `packages/collaboration-prototype/src/session/replayPolicy.ts` defines `replayCollaborationCommandEnvelopes`.
- That replay policy sorts envelopes deterministically and records accepted or rejected entries.
- `packages/collaboration-prototype/src/entityGraphAdapter.ts` still exposes `projectFromCollaborationDoc`.
- `projectFromCollaborationDoc` reads Yjs commands and directly reduces them through `applyCommand`.

That means there are currently two replay semantics:

1. The new Phase 6 session replay policy with rejection entries.
2. The old Yjs document replay path that can throw or silently become the preferred path for future developers.

Phase 7 must remove this ambiguity before adding any UI or provider behavior.

Required fix:

- Route the Yjs adapter through `replayCollaborationCommandEnvelopes`, or deprecate and remove `projectFromCollaborationDoc`.
- If a compatibility helper remains, it must return `CollaborationReplayResult`, not only `ProjectGraph`.
- No collaboration code should replay remote commands by reducing `Command[]` directly with `applyCommand` outside the canonical replay policy.

Recommended new helper shape:

```ts
export function replayCollaborationDoc(
  baseProject: ProjectGraph,
  collaborationDoc: CollaborationDoc
): CollaborationReplayResult;
```

Compatibility allowance:

```ts
/**
 * @deprecated Use replayCollaborationDoc so rejected remote commands stay visible.
 */
export function projectFromCollaborationDoc(...): ProjectGraph;
```

If the deprecated helper is kept, its implementation must call `replayCollaborationDoc` internally and must not become the productized path.

## 3. Non-Goals

Do not implement these in Phase 7:

- Default multiplayer or default provider connection.
- Real account system, cloud hosting, billing, or team workspace management.
- Project-level CRDT storage.
- Presence, cursor, room, actor, provider, retry queue, or Yjs updates in `ProjectGraph`.
- Collaboration state in `.lcproj/project.json`, exports, reports, or release manifests.
- Workbench, schema, core, or editor-ui dependencies on `yjs` or `@labyrinth/collaboration-prototype`.
- A marketing page or large collaboration banner.
- A second command bus, second validation system, or second project graph model.

Phase 7 may build a Collaboration Lab only if it is explicit opt-in and app/session-local.

## 4. Architecture Principles

### 4.1 ProjectGraph Stays Portable

Allowed in `ProjectGraph`:

- spaces
- connections
- gates
- tokens
- puzzles
- beats
- rule presets and overrides
- diagnostic exceptions
- review threads
- portable asset references

Forbidden in `ProjectGraph`:

- actor id
- user id
- peer id
- cursor
- selection
- viewport
- presence
- room id
- provider URL
- connection status
- retry queue
- CRDT metadata
- Yjs update
- sync clock
- local absolute path

### 4.2 Remote Edits Enter Only As Commands

Remote edits may enter the project flow only through:

```text
CollaborationCommandEnvelope.command -> canonical replay policy -> workbench applyCommand
```

Allowed:

- serialize and parse command envelopes
- order envelopes deterministically
- reject invalid or conflicting commands at session level
- show rejected commands in lab UI
- keep actor metadata in session state

Forbidden:

- remote update directly patches `ProjectGraph`
- provider calls validation internals
- collaboration adapter reimplements command handlers
- UI reads or writes a Yjs document directly
- collaboration package owns a canonical project graph

### 4.3 Main Packages Must Stay Collaboration-Free

These packages must not import collaboration code or provider code:

- `packages/schema`
- `packages/core`
- `packages/rulesets`
- `packages/exporters`
- `packages/workbench`
- `packages/editor-ui`
- `apps/cli`

`apps/desktop` may host an opt-in lab path only if the default desktop path does not import or connect a provider.

### 4.4 Collaboration Is A Session Adapter

`packages/collaboration-prototype` may import schema types and workbench command contracts.

It must not import:

- `@labyrinth/core`
- `@labyrinth/rulesets`
- `@labyrinth/exporters`
- `@labyrinth/editor-ui`
- Tauri APIs
- app host modules
- Node file system APIs

Provider configuration and local logs belong to the host app, not the collaboration package.

### 4.5 UI Receives View Models Only

If Phase 7 creates a Collaboration Lab UI, editor UI components should receive plain view models:

```ts
type CollaborationLabViewModel = {
  status: 'off' | 'connecting' | 'connected' | 'error';
  peers: Array<{ id: string; label: string; color: string }>;
  commandLog: Array<{ id: string; actorLabel: string; status: 'accepted' | 'rejected' }>;
  rejections: Array<{ id: string; reason: string }>;
};
```

The UI must not import `yjs`, provider adapters, or raw collaboration documents.

## 5. Implementation Rounds

### Round 1: Converge Replay Semantics

Tasks:

- Add `replayCollaborationDoc` to the Yjs adapter or an adjacent adapter module.
- Make it call `replayCollaborationCommandEnvelopes`.
- Deprecate or remove `projectFromCollaborationDoc`.
- Update adapter tests to assert rejected commands are returned as session rejections.
- Add a test for editing an entity after it has been deleted.
- Add a test proving Yjs delivery order does not bypass the deterministic replay order.

Architecture requirements:

- Only one canonical replay policy may apply remote commands.
- Any helper that returns a `ProjectGraph` must be a compatibility wrapper, not a productized path.
- Rejections must remain inspectable by host or lab UI.

Acceptance:

- No direct remote replay path reduces commands with `applyCommand` outside `replayPolicy.ts`.
- `entityGraphAdapter.test.ts` covers accepted and rejected replay.
- Existing Phase 6 replay tests still pass.

### Round 2: Harden Command Envelope Validation

Tasks:

- Add a runtime parser or guard for `CollaborationCommandEnvelope`.
- Reject malformed envelope shape before replay.
- Reject missing or duplicate envelope id.
- Reject unknown command type through existing workbench command handling or explicit parser errors.
- Add stable rejection categories for UI and logs.

Suggested categories:

```ts
type CollaborationRejectionCode =
  | 'malformed-envelope'
  | 'duplicate-envelope'
  | 'invalid-command'
  | 'conflict'
  | 'unsupported-command';
```

Architecture requirements:

- Parser stays in the collaboration package.
- Parser does not add fields to schema.
- Command validation remains owned by existing workbench/domain logic.

Acceptance:

- Malformed remote input does not throw out of the public replay API.
- Malformed remote input does not mutate the project.
- Rejection reason is stable enough for UI and logs.

### Round 3: Define Provider Lifecycle And Opt-In Host Policy

Tasks:

- Define whether Phase 7 keeps the in-memory fake provider, adds a Yjs provider wrapper, or defers real provider work.
- Add explicit lifecycle states: off, connecting, connected, reconnecting, disconnected, error.
- Ensure provider connect is never called on default desktop startup.
- Keep provider URL, room id, auth token, retry queue, and peer state out of project files.
- Store any temporary provider settings only in app-local preferences.

Architecture requirements:

- Provider adapter owns transport only.
- Provider adapter does not own project state.
- Desktop host owns opt-in and lifecycle.
- Main editor path stays usable when provider settings are corrupted or missing.

Acceptance:

- Tests prove default host state is off.
- Tests or smoke prove explicit opt-in is required before connect.
- Architecture check prevents provider imports outside allowed paths.

### Round 4: Build Optional Collaboration Lab Candidate

Only do this round after Rounds 1 to 3 pass.

Tasks:

- Add an explicit lab entry point or feature flag.
- Show compact session status.
- Show accepted and rejected command entries.
- Show minimal peer labels if identity policy exists.
- Add a visible disconnect/off control.
- Keep the main editing canvas quiet and unchanged when lab is off.

UI rules:

- No marketing hero.
- No permanent collaboration banner.
- No raw Yjs updates or provider debug dump.
- No layout that blocks save, open, validate, export, or editing.
- No default provider connection.

Architecture requirements:

- UI consumes plain view models.
- UI does not import `yjs`.
- UI does not mutate `ProjectGraph` directly.
- UI state is session-local.

Acceptance:

- With lab off, normal desktop flow is unchanged.
- With lab on, save, open, validate, export, and RC dry run still work.
- Project serialization contains no session fields after using the lab.

### Round 5: Privacy, Identity, And Permission Decision

Tasks:

- Document actor labels and display names.
- Decide whether actor ids are anonymous, local-only, or authenticated later.
- Decide whether room ids can be displayed, logged, or copied.
- Decide whether command logs may contain project content.
- Define redaction rules for support logs.
- Keep telemetry off unless a later phase explicitly approves it.

Required document:

```text
docs/collaboration/phase7-privacy-identity-policy.md
```

Architecture requirements:

- Identity metadata is session state.
- Permission checks are not embedded in `ProjectGraph`.
- Logs are host-owned and ignored by git.

Acceptance:

- `.lcproj` does not contain actor, room, or provider metadata.
- App-local logs are ignored or disposable.
- Privacy policy explains what may be shown in UI and logs.

### Round 6: Collaborative Undo And Replay Decision

Tasks:

- Decide whether remote commands enter local undo/redo.
- If remote commands do not enter undo, document why and test it.
- If actor-scoped undo is desired, write an ADR before implementation.
- Ensure undo behavior does not create divergent project states.

Recommended minimum for Phase 7:

```text
Remote commands are replayed into project state but do not enter the local user's undo stack.
Local undo only reverts local commands unless a later ADR accepts actor-scoped collaborative undo.
```

Architecture requirements:

- Undo policy belongs to workbench/session coordination, not provider transport.
- Provider must not decide undo semantics.
- UI must not fake undo by directly patching `ProjectGraph`.

Acceptance:

- Undo tests cover local command, remote accepted command, and remote rejected command.
- Policy is documented before UI text claims collaborative undo exists.

### Round 7: Architecture Guards And Phase 7 Acceptance

Tasks:

- Update `scripts/check-architecture.mjs`.
- Add required Phase 7 docs to docs checks if needed.
- Add tests for replay convergence, envelope parsing, provider opt-in, and project serialization purity.
- Run local full gate.
- Confirm remote GitHub Actions `Labyrinth RC Gate` passes.
- Output `docs/phase7-acceptance-review.md`.

Minimum local verification:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
npx --yes pnpm@11.7.0 e2e
cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

Remote verification:

```text
GitHub Actions: Labyrinth RC Gate must pass on the final pushed commit.
```

## 6. Required Architecture Guard Updates

Strengthen `scripts/check-architecture.mjs` to cover Phase 7 boundaries.

Required checks:

- Main package manifests must not depend on `@labyrinth/collaboration-prototype`, `@labyrinth/collaboration-session`, `yjs`, `y-websocket`, or `y-webrtc`.
- `ProjectGraph` type and JSON schema must not contain session, presence, cursor, provider, room, peer, or Yjs fields.
- `packages/schema`, `packages/core`, `packages/workbench`, and `packages/editor-ui` must not import collaboration packages or provider packages.
- `apps/cli` must not import collaboration providers.
- `apps/desktop` default entry path must not import or connect collaboration providers.
- `packages/collaboration-prototype` must not import app host modules or file system APIs.
- Tests must fail if `entityGraphAdapter.ts` keeps a direct `applyCommand` replay reducer outside the canonical replay policy.

Suggested additional static guard:

```text
If a non-test collaboration adapter file imports applyCommand directly,
it must be replayPolicy.ts or a documented compatibility wrapper that delegates to replayPolicy.ts.
```

If this static rule is too brittle, cover it through a focused unit test and a clear deprecation comment.

## 7. Required Tests

Unit tests:

- `replayCollaborationDoc` returns `CollaborationReplayResult`.
- Deleted entity plus later remote edit becomes a rejected replay entry.
- Malformed envelope is rejected and does not mutate project.
- Duplicate envelope id is rejected or ignored deterministically.
- Unknown command type is rejected through a stable category.
- Remote accepted command does not add session metadata to `ProjectGraph`.
- Default provider lifecycle state is off.
- Explicit opt-in is required before provider connect.
- Local undo does not accidentally undo remote commands unless an ADR accepts that behavior.

Integration tests:

- Save/open after collaboration replay produces the same portable project shape.
- Validation/report/export ignore session logs.
- Corrupted app-local collaboration settings do not prevent project open.
- Feature flag off path does not execute provider connect.

E2E tests if lab UI is implemented:

- Lab is hidden or off by default.
- Opt-in lab shows session status.
- Accepted and rejected remote commands are visible in lab UI.
- Project can still save, open, validate, and export after lab usage.
- Mobile or narrow viewport has no severe overflow for the lab panel.

## 8. UI Direction

Keep Phase 7 UI practical and restrained.

Allowed:

- compact status indicator
- explicit opt-in toggle or lab entry
- disconnect/off button
- command log
- rejected command panel
- peer labels and colors if privacy policy permits
- small conflict/rejection details

Forbidden:

- collaboration landing page
- large banner on main editing path
- default online state
- unavoidable presence overlay
- raw provider or Yjs debug output
- UI state written into project save files

The UI should feel like an engineering lab or controlled beta surface, not a finished multiplayer promise.

## 9. Phase 7 Red Lines

Phase 7 must not pass acceptance if any of these happen:

- Two replay semantics remain active.
- `projectFromCollaborationDoc` remains the recommended productized path.
- A Yjs adapter directly patches or directly reduces into `ProjectGraph` outside canonical replay policy.
- `ProjectGraph` stores presence, cursor, actor, room, provider, connection, retry, or Yjs metadata.
- Desktop startup connects a collaboration provider by default.
- Workbench imports collaboration or provider packages.
- Editor UI imports `yjs` or provider packages.
- Remote commands bypass existing workbench command handling.
- Rejected remote commands disappear without an inspectable session entry.
- `.lcproj/project.json` stores collaboration session state.
- Architecture check does not cover the new boundary.
- Local full gate or remote RC gate is red while the phase is marked Pass.

## 10. Completion Definition

Phase 7 is complete only when:

- There is exactly one canonical remote replay path.
- The old Yjs doc replay helper is removed, deprecated, or internally routed through the canonical replay policy.
- Malformed or conflicting remote commands become inspectable session rejections.
- Provider lifecycle is explicit and opt-in.
- Any lab UI is isolated from provider internals and off by default.
- Privacy, identity, permissions, and collaborative undo decisions are documented.
- Project serialization remains free of session state.
- Architecture guard blocks collaboration leaks into main packages.
- Local full gate passes.
- Remote `Labyrinth RC Gate` passes on the final pushed commit.
- `docs/phase7-acceptance-review.md` records the result and next decision.

Phase 7 final decision must be one of:

- `continue experiment`
- `accept opt-in collaboration beta candidate`
- `defer collaboration productization`

Do not mark Phase 7 as product accepted unless provider, identity, privacy, permission, offline/reconnect, undo, and explicit opt-in UX have all been decided and verified.

## 11. Short Prompt For The Developer AI

```text
Implement Phase 7 as a collaboration productization candidate, not default multiplayer.
First converge replay semantics: route the old Yjs entityGraphAdapter replay through replayCollaborationCommandEnvelopes or deprecate/remove projectFromCollaborationDoc. There must be exactly one canonical remote replay path, and rejected remote commands must remain inspectable.
Then harden envelope parsing, duplicate handling, provider lifecycle, privacy/identity policy, collaborative undo policy, and optional opt-in Collaboration Lab UI.
Do not put presence, cursor, peer, room, provider, retry, Yjs, actor session metadata, or connection state into ProjectGraph or .lcproj files.
schema/core/workbench/editor-ui must not import collaboration packages or yjs. Desktop may host collaboration only behind explicit opt-in, with no default provider connection.
Update tests and scripts/check-architecture.mjs, run the full local gate, confirm GitHub Actions Labyrinth RC Gate passes, and output docs/phase7-acceptance-review.md.
```

Before adding any field or dependency, answer:

1. Is this project truth, session state, host state, or generated output?
2. Can this be derived from command replay instead of stored?
3. Would this make schema, core, workbench, or editor-ui depend on collaboration?
4. Would this appear in `.lcproj/project.json`?
5. Is the boundary enforced by tests and architecture checks?

If the answer is unclear, do not put it on the main path.
