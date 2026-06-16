import { createProjectRepository, type ProjectRepository } from '@labyrinth/workbench';
import { invoke, isTauri } from '@tauri-apps/api/core';

import {
  addRecentProjectPreference,
  createDefaultDesktopPreferences,
  parseDesktopPreferencesText,
  serializeDesktopPreferences,
  type DesktopPreferences
} from '../preferences/preferences.js';
import horrorClinicProjectText from '../../../../packages/test-fixtures/samples/horror-clinic.lcproj.json?raw';

type ReportFormat = 'markdown' | 'json';

export type DesktopAdapters = {
  projectRepository: ProjectRepository;
  reportRepository: ReportRepository;
  engineExportRepository: EngineExportRepository;
  preferencesRepository: PreferencesRepository;
};

export type ReportSaveResult =
  | {
      ok: true;
      path?: string;
    }
  | {
      ok: false;
      message: string;
    };

export type ReportRepository = {
  saveReportAs(text: string, format: ReportFormat): Promise<ReportSaveResult>;
};

export type EngineExportRepository = {
  saveEngineExportAs(text: string): Promise<ReportSaveResult>;
};

export type PreferencesLoadResult =
  | {
      ok: true;
      preferences: DesktopPreferences;
      recovered: boolean;
      message?: string;
      path?: string;
      logDirectory?: string;
    }
  | {
      ok: false;
      preferences: DesktopPreferences;
      message: string;
      path?: string;
      logDirectory?: string;
    };

export type PreferencesSaveResult =
  | {
      ok: true;
      path?: string;
      logDirectory?: string;
    }
  | {
      ok: false;
      message: string;
    };

export type PreferencesRepository = {
  loadPreferences(): Promise<PreferencesLoadResult>;
  savePreferences(preferences: DesktopPreferences): Promise<PreferencesSaveResult>;
  resetPreferences(): Promise<PreferencesSaveResult>;
  addRecentProject(path: string): Promise<PreferencesLoadResult>;
  appendLog(entry: string): Promise<PreferencesSaveResult>;
};

type ProjectFileResult = {
  text: string;
  path?: string;
};

type PreferencesFileResult = {
  text?: string | null;
  path?: string;
  logDirectory?: string;
};

type SaveProjectFileResult = {
  path?: string;
};

export type TauriProjectFileClient = {
  isAvailable(): boolean;
  openProjectFile(): Promise<ProjectFileResult | null>;
  openProjectPackage(): Promise<ProjectFileResult | null>;
  saveProjectFile(text: string, path: string): Promise<SaveProjectFileResult>;
  saveProjectFileAs(text: string): Promise<SaveProjectFileResult | null>;
  saveReportFileAs(text: string, format: ReportFormat): Promise<SaveProjectFileResult | null>;
  saveEngineExportFileAs(text: string): Promise<SaveProjectFileResult | null>;
  loadPreferences(): Promise<PreferencesFileResult>;
  savePreferences(text: string): Promise<SaveProjectFileResult>;
  resetPreferences(text: string): Promise<SaveProjectFileResult>;
  appendAppLog(entry: string): Promise<SaveProjectFileResult>;
};

const samplePath = 'packages/test-fixtures/samples/horror-clinic.lcproj.json';
const saveAsPath = 'labyrinth-composer-copy.lcproj.json';
const browserPreferencesKey = 'labyrinth-composer.desktop.preferences.v1';

function reportFileName(format: ReportFormat): string {
  return format === 'json' ? 'labyrinth-report.json' : 'labyrinth-report.md';
}

function reportMimeType(format: ReportFormat): string {
  return format === 'json' ? 'application/json' : 'text/markdown';
}

function engineExportFileName(): string {
  return 'engine-export.json';
}

function downloadText(text: string, filename: string, mimeType = 'application/json') {
  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([text], {
    type: mimeType
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const defaultTauriProjectFileClient: TauriProjectFileClient = {
  isAvailable: isTauri,
  openProjectFile() {
    return invoke<ProjectFileResult | null>('open_project_file');
  },
  openProjectPackage() {
    return invoke<ProjectFileResult | null>('open_project_package');
  },
  saveProjectFile(text, path) {
    return invoke<SaveProjectFileResult>('save_project_file', {
      path,
      text
    });
  },
  saveProjectFileAs(text) {
    return invoke<SaveProjectFileResult | null>('save_project_file_as', {
      text
    });
  },
  saveReportFileAs(text, format) {
    return invoke<SaveProjectFileResult | null>('save_report_file_as', {
      format,
      text
    });
  },
  saveEngineExportFileAs(text) {
    return invoke<SaveProjectFileResult | null>('save_engine_export_file_as', {
      text
    });
  },
  loadPreferences() {
    return invoke<PreferencesFileResult>('load_preferences');
  },
  savePreferences(text) {
    return invoke<SaveProjectFileResult>('save_preferences', {
      text
    });
  },
  resetPreferences(text) {
    return invoke<SaveProjectFileResult>('reset_preferences', {
      text
    });
  },
  appendAppLog(entry) {
    return invoke<SaveProjectFileResult>('append_app_log', {
      entry
    });
  }
};

function getBrowserStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function createPreferencesLoadResult(
  preferences: DesktopPreferences,
  recovered: boolean,
  metadata: Pick<PreferencesLoadResult & { ok: true }, 'message' | 'path' | 'logDirectory'> = {}
): PreferencesLoadResult {
  return {
    ok: true,
    preferences,
    recovered,
    ...metadata
  };
}

export function createDesktopAdapters(
  tauriProjectFileClient = defaultTauriProjectFileClient
): DesktopAdapters {
  async function loadPreferences(): Promise<PreferencesLoadResult> {
    const defaults = createDefaultDesktopPreferences();

    if (tauriProjectFileClient.isAvailable()) {
      try {
        const loaded = await tauriProjectFileClient.loadPreferences();
        const parsed = parseDesktopPreferencesText(loaded.text);

        if (!parsed.ok) {
          const resetText = serializeDesktopPreferences(parsed.preferences);
          await tauriProjectFileClient.resetPreferences(resetText);

          return createPreferencesLoadResult(parsed.preferences, true, {
            message: parsed.message,
            path: loaded.path,
            logDirectory: loaded.logDirectory
          });
        }

        return createPreferencesLoadResult(parsed.preferences, false, {
          path: loaded.path,
          logDirectory: loaded.logDirectory
        });
      } catch (error) {
        return {
          ok: false,
          preferences: defaults,
          message: `Preferences load failed: ${String(error)}`
        };
      }
    }

    try {
      const storage = getBrowserStorage();
      const parsed = parseDesktopPreferencesText(storage?.getItem(browserPreferencesKey));

      if (!parsed.ok) {
        storage?.setItem(browserPreferencesKey, serializeDesktopPreferences(parsed.preferences));

        return createPreferencesLoadResult(parsed.preferences, true, {
          message: parsed.message
        });
      }

      return createPreferencesLoadResult(parsed.preferences, false);
    } catch (error) {
      return {
        ok: false,
        preferences: defaults,
        message: `Preferences load failed: ${String(error)}`
      };
    }
  }

  async function savePreferences(preferences: DesktopPreferences): Promise<PreferencesSaveResult> {
    const text = serializeDesktopPreferences(preferences);

    try {
      if (tauriProjectFileClient.isAvailable()) {
        return {
          ok: true,
          ...(await tauriProjectFileClient.savePreferences(text))
        };
      }

      getBrowserStorage()?.setItem(browserPreferencesKey, text);

      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        message: `Preferences save failed: ${String(error)}`
      };
    }
  }

  async function resetPreferences(): Promise<PreferencesSaveResult> {
    const preferences = createDefaultDesktopPreferences();
    const text = serializeDesktopPreferences(preferences);

    try {
      if (tauriProjectFileClient.isAvailable()) {
        return {
          ok: true,
          ...(await tauriProjectFileClient.resetPreferences(text))
        };
      }

      getBrowserStorage()?.setItem(browserPreferencesKey, text);

      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        message: `Preferences reset failed: ${String(error)}`
      };
    }
  }

  async function addRecentProject(path: string): Promise<PreferencesLoadResult> {
    const loaded = await loadPreferences();
    const nextPreferences = addRecentProjectPreference(loaded.preferences, path);
    const saved = await savePreferences(nextPreferences);

    if (!saved.ok) {
      return {
        ok: false,
        preferences: nextPreferences,
        message: saved.message,
        path: loaded.path,
        logDirectory: loaded.logDirectory
      };
    }

    return createPreferencesLoadResult(nextPreferences, loaded.ok ? loaded.recovered : true, {
      message: loaded.ok ? loaded.message : loaded.message,
      path: saved.path ?? loaded.path,
      logDirectory: saved.logDirectory ?? loaded.logDirectory
    });
  }

  async function appendLog(entry: string): Promise<PreferencesSaveResult> {
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      entry
    });

    try {
      if (tauriProjectFileClient.isAvailable()) {
        return {
          ok: true,
          ...(await tauriProjectFileClient.appendAppLog(payload))
        };
      }

      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        message: `App log write failed: ${String(error)}`
      };
    }
  }

  return {
    projectRepository: createProjectRepository({
      async openText() {
        if (tauriProjectFileClient.isAvailable()) {
          const openedFile = await tauriProjectFileClient.openProjectFile();

          if (openedFile !== null) {
            return openedFile;
          }

          return tauriProjectFileClient.openProjectPackage();
        }

        return {
          text: horrorClinicProjectText,
          path: samplePath
        };
      },
      async saveText(text, target) {
        if (tauriProjectFileClient.isAvailable()) {
          if (target?.path !== undefined) {
            return tauriProjectFileClient.saveProjectFile(text, target.path);
          }

          const saved = await tauriProjectFileClient.saveProjectFileAs(text);

          if (saved === null) {
            throw new Error('Project save was cancelled.');
          }

          return saved;
        }

        if (target?.path === undefined) {
          downloadText(text, saveAsPath);

          return {
            path: saveAsPath
          };
        }

        return {
          path: target.path
        };
      },
      async saveTextAs(text) {
        if (tauriProjectFileClient.isAvailable()) {
          const saved = await tauriProjectFileClient.saveProjectFileAs(text);

          if (saved === null) {
            throw new Error('Project save was cancelled.');
          }

          return saved;
        }

        downloadText(text, saveAsPath);

        return {
          path: saveAsPath
        };
      }
    }),
    reportRepository: {
      async saveReportAs(text, format) {
        try {
          if (tauriProjectFileClient.isAvailable()) {
            const saved = await tauriProjectFileClient.saveReportFileAs(text, format);

            if (saved === null) {
              throw new Error('Report save was cancelled.');
            }

            return {
              ok: true,
              path: saved.path
            };
          }

          const filename = reportFileName(format);
          downloadText(text, filename, reportMimeType(format));

          return {
            ok: true,
            path: filename
          };
        } catch (error) {
          return {
            ok: false,
            message: `Report save failed: ${String(error)}`
          };
        }
      }
    },
    engineExportRepository: {
      async saveEngineExportAs(text) {
        try {
          if (tauriProjectFileClient.isAvailable()) {
            const saved = await tauriProjectFileClient.saveEngineExportFileAs(text);

            if (saved === null) {
              throw new Error('Engine export save was cancelled.');
            }

            return {
              ok: true,
              path: saved.path
            };
          }

          const filename = engineExportFileName();
          downloadText(text, filename, 'application/json');

          return {
            ok: true,
            path: filename
          };
        } catch (error) {
          return {
            ok: false,
            message: `Engine export save failed: ${String(error)}`
          };
        }
      }
    },
    preferencesRepository: {
      loadPreferences,
      savePreferences,
      resetPreferences,
      addRecentProject,
      appendLog
    }
  };
}
