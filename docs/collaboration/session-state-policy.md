# Collaboration Session State Policy

Date: 2026-06-16

Status: Phase 6 policy for collaboration experiments and future productization decisions.

## Principle

Collaboration state is session state or host state, not project truth.

`ProjectGraph`, `.lcproj/project.json`, package manifests, validation results, reports, exports, review threads, and asset refs must remain portable domain data. They must not store provider state, presence, connection metadata, retry queues, remote cursors, room identifiers, or actor session metadata.

## Allowed Session State

The collaboration adapter may keep these values in memory:

- command envelopes
- provider delivery order
- session-level accepted/rejected replay entries
- actor id or display label
- presence preview
- remote cursor preview
- connection status
- retry queue
- transient debug messages

These values are disposable. Closing the session may lose them unless a future explicit host policy chooses to persist local diagnostics.

## Allowed Host-Local State

The desktop host may store opt-in collaboration settings in app-local storage only:

- last used provider kind
- local lab enabled flag
- redacted or user-entered room hint
- local actor display name
- local log retention preference

Host-local state must be ignored by git and must not be copied into `.lcproj` packages. Corrupted host-local collaboration settings must fall back to defaults and must not block opening a project.

Current ignored local locations include:

- `apps/desktop/.app-data/`
- `apps/desktop/logs/`
- `apps/desktop/collaboration-session/`
- `apps/desktop/collaboration-logs/`

## Forbidden Project Data

The following fields must not appear in `ProjectGraph`, schema JSON, `.lcproj/project.json`, reports, exports, or package manifests:

- `actorId`
- `connectionStatus`
- `cursor`
- `peerId`
- `presence`
- `providerState`
- `providerUrl`
- `retryQueue`
- `roomId`
- `sessionId`
- `syncClock`
- `yjsUpdate`
- CRDT metadata

## Logging

Collaboration logs are disabled by default.

If a lab host enables local logs, logs must be app-local and redacted by default. They may record command envelope ids, command types, accepted/rejected status, and non-sensitive error categories. They must not record provider auth tokens, raw Yjs updates, full provider URLs, private room ids, or project file contents.

Any telemetry or usage reporting is out of scope for Phase 6 and must remain disabled by default until a separate privacy review accepts it.

## Recovery

Project open/save must ignore collaboration session/cache/log directories. A damaged collaboration session file or app-local setting cannot make a valid `.lcproj` invalid.

The collaboration package must not write files directly. File persistence, if ever needed for an explicit lab host, must be provided by a host adapter that keeps data outside project truth.
