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
