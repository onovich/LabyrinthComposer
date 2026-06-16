# Collaboration Conflict Semantics

Date: 2026-06-16

Status: Phase 6 session-collaboration candidate policy.

## Scope

Collaboration conflicts are session concerns. They do not change `ProjectGraph`, JSON Schema, validation rules, report generation, or export formats.

The collaboration prototype replays serializable workbench commands from `CollaborationCommandEnvelope` records. Envelope metadata such as `id`, `actorId`, `createdAt`, delivery order, provider state, presence, cursor, connection status, retry queue, and rejection reason stays in the collaboration session layer.

## Ordering

The Phase 6 prototype uses an append-only command log. Replay order is deterministic:

1. `createdAt`, ascending when present.
2. `id`, ascending as a tie-breaker.
3. original provider delivery index as the final tie-breaker.

Providers that need stronger causality must normalize their delivery stream before productization. That is a Phase 7 decision; Phase 6 only proves that a given command log has a stable replay result.

## Applying Commands

Remote commands are applied through the existing workbench command handler. The collaboration adapter must not patch `ProjectGraph` directly and must not reimplement command handlers.

Accepted commands update the replay project. Rejected commands create session-level rejection entries and leave the current project unchanged.

## Conflict Rules

Simultaneous edits to the same entity:

- Commands are ordered by the deterministic replay policy.
- Later accepted commands win only through normal command replay.
- There is no hidden merge state in `ProjectGraph`.

Edits after removal:

- A command that targets an entity already removed or absent is rejected at the session layer.
- The adapter must not silently recreate the entity.
- The rejection can be shown in a lab UI or debug log, but it must not be saved into `.lcproj/project.json`.

Replay failure:

- Failure affects only the failed command.
- The previous valid project snapshot remains the replay result.
- Validation may be run on the resulting `ProjectGraph`, but validation does not read the session log.

Undo/redo:

- Remote commands do not enter the local undo/redo stack in Phase 6.
- Productized collaborative undo requires a separate Phase 7 decision about actor scope, intention preservation, and conflict recovery.

Actor attribution:

- `actorId` is session display metadata only.
- Actor attribution must not enter `ProjectGraph`, reports, exports, package manifests, or validation results.

## Productization Bar

Before collaboration can move into the main product path, Phase 7 must define provider causality, identity, permission, offline replay, rollback, and privacy policy. Until then, collaboration remains an isolated prototype over the command bus.
