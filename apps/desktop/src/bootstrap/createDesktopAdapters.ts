import { createProjectRepository, type ProjectRepository } from '@labyrinth/workbench';
import { invoke, isTauri } from '@tauri-apps/api/core';

import horrorClinicProjectText from '../../../../packages/test-fixtures/samples/horror-clinic.lcproj.json?raw';

export type DesktopAdapters = {
  projectRepository: ProjectRepository;
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
  saveProjectFile(text: string, path: string): Promise<SaveProjectFileResult>;
  saveProjectFileAs(text: string): Promise<SaveProjectFileResult | null>;
};

const samplePath = 'packages/test-fixtures/samples/horror-clinic.lcproj.json';
const saveAsPath = 'labyrinth-composer-copy.lcproj.json';

function downloadText(text: string, filename: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([text], {
    type: 'application/json'
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
  }
};

export function createDesktopAdapters(
  tauriProjectFileClient = defaultTauriProjectFileClient
): DesktopAdapters {
  return {
    projectRepository: createProjectRepository({
      async openText() {
        if (tauriProjectFileClient.isAvailable()) {
          return tauriProjectFileClient.openProjectFile();
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
    })
  };
}
