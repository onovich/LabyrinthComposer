import { createProjectRepository, type ProjectRepository } from '@labyrinth/workbench';
import { invoke, isTauri } from '@tauri-apps/api/core';

import horrorClinicProjectText from '../../../../packages/test-fixtures/samples/horror-clinic.lcproj.json?raw';

type ReportFormat = 'markdown' | 'json';

export type DesktopAdapters = {
  projectRepository: ProjectRepository;
  reportRepository: ReportRepository;
  engineExportRepository: EngineExportRepository;
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

type ProjectFileResult = {
  text: string;
  path?: string;
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
};

const samplePath = 'packages/test-fixtures/samples/horror-clinic.lcproj.json';
const saveAsPath = 'labyrinth-composer-copy.lcproj.json';

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
  }
};

export function createDesktopAdapters(
  tauriProjectFileClient = defaultTauriProjectFileClient
): DesktopAdapters {
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
    }
  };
}
