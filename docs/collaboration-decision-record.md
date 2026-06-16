# Collaboration Decision Record

Date: 2026-06-16

Status: experiment only for Phase 5 RC.

Decision:

Labyrinth Composer does not productize real-time collaboration in Phase 5. The Yjs experiment remains isolated in `packages/collaboration-prototype` and is not loaded by the main desktop path.

Allowed in Phase 5:

- prototype-only Yjs command replay experiments
- prototype unit tests
- decision documentation

Not allowed in Phase 5:

- WorkbenchStore depending on Yjs
- desktop loading a collaboration provider by default
- schema storing presence, peer ids, provider state, cursors, or local session metadata
- ProjectGraph becoming a CRDT document

Required before productization:

- conflict semantics for simultaneous edits
- presence privacy and retention policy
- provider selection
- offline/reconnect behavior
- migration policy for any collaboration metadata
- separate product acceptance phase

Architectural consequence:

Collaboration remains a decision gate, not a hidden dependency. Project truth stays in `ProjectGraph`, review threads remain ordinary project data, and provider/session state stays outside the main application until a later phase explicitly accepts it.

## Phase 6 Clarification

Phase 6 keeps the collaboration prototype as a session adapter over commands. Productization cannot require or permit presence, cursors, peer ids, provider state, connection status, retry queues, or Yjs updates to enter `ProjectGraph`.

Decision gate semantics:

- `presencePolicy` is `session-only`.
- `providerStatePolicy` is `host-session-only`.
- `projectGraphStoresPresence` must remain `false`.
- `packages/workbench`, `packages/schema`, `packages/core`, and `packages/editor-ui` must not depend on `@labyrinth/collaboration-prototype` or `yjs`.
- `canEnableCollaborationByDefault` may only return true for an accepted productization gate when the workbench remains collaboration-free and all required pre-productization items are complete.

Collaboration productization therefore means accepting a constrained session collaboration path, not turning the portable project file into a CRDT document.
