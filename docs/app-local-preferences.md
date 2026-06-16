# App-local Preferences And Logs

Date: 2026-06-16

Phase 5 keeps local desktop state outside project truth.

App-local state includes:

- recent project paths
- last opened directory
- window size and maximized state
- theme preference
- telemetry opt-in
- desktop logs

Storage boundary:

- TypeScript preference normalization lives in `apps/desktop/src/preferences/`.
- Tauri host storage lives in `apps/desktop/src-tauri/src/preferences.rs`.
- Preferences are stored in the operating system app data directory.
- Logs are appended under the app-local `logs/` directory.

Project boundary:

- `ProjectGraph` must not include recent files, absolute local paths, window state, logs, or telemetry state.
- `.lcproj/project.json` remains canonical project data only.
- Workbench, schema, core, rulesets, and exporters must not depend on preference storage.

Corruption behavior:

- missing preferences load as defaults
- corrupted preferences are ignored
- corrupted preferences are reset to defaults
- corrupted preferences do not block project open/save

The dashboard may display recent files as host-provided view data. It must not write recent files into project data.
