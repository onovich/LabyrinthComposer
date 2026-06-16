# Phase 6 Collaboration Productization Decision

Date: 2026-06-16

Decision: continue experiment.

## Rationale

Phase 6 proves that collaboration can remain a session adapter over serializable workbench commands without making `ProjectGraph` a CRDT document. The prototype now has a corrected decision gate, command envelopes, deterministic replay, conflict rejection semantics, provider-neutral adapter boundaries, and session-state policy.

This is enough to keep collaboration as a candidate for a later Phase 7 productization discussion, but it is not enough to enable real-time collaboration in the main desktop path.

## Accepted Phase 6 Boundary

- Collaboration remains isolated in `packages/collaboration-prototype`.
- `packages/schema`, `packages/core`, `packages/workbench`, and `packages/editor-ui` do not depend on `@labyrinth/collaboration-prototype` or `yjs`.
- `ProjectGraph` does not store presence, cursor, peer id, provider state, room id, connection status, retry queue, Yjs updates, or actor session metadata.
- Remote edits can only enter as `CollaborationCommandEnvelope.command` and must be applied through the existing workbench command handler.
- Provider state is host/session state, not project data.
- Lab UI is not implemented in Phase 6; no default desktop path loads a provider.

## Required Before Phase 7 Acceptance

Phase 7 must decide:

- provider implementation and hosting model
- identity and permission policy
- privacy review for actor labels, room ids, logs, and telemetry
- offline/reconnect ordering and rollback behavior
- whether remote commands participate in collaborative undo
- explicit opt-in UX for any lab or product collaboration entry point
- support and recovery plan for failed replay or provider divergence

Until those decisions are accepted, collaboration remains an experiment and release gates must not require a live collaboration provider.
