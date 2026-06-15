import { createProjectRepository, type ProjectRepository } from '@labyrinth/workbench';

import horrorClinicProjectText from '../../../../packages/test-fixtures/samples/horror-clinic.lcproj.json?raw';

export type DesktopAdapters = {
  projectRepository: ProjectRepository;
};

const samplePath = 'packages/test-fixtures/samples/horror-clinic.lcproj.json';
const saveAsPath = 'labyrinth-composer-copy.lcproj.json';

function downloadText(text: string, filename: string) {
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

export function createDesktopAdapters(): DesktopAdapters {
  return {
    projectRepository: createProjectRepository({
      async openText() {
        return {
          text: horrorClinicProjectText,
          path: samplePath
        };
      },
      async saveText(_text, target) {
        return {
          path: target?.path ?? saveAsPath
        };
      },
      async saveTextAs(text) {
        downloadText(text, saveAsPath);

        return {
          path: saveAsPath
        };
      }
    })
  };
}
