import { createProjectRepository, type ProjectRepository } from '@labyrinth/workbench';

export type DesktopAdapters = {
  projectRepository: ProjectRepository;
};

export function createDesktopAdapters(): DesktopAdapters {
  return {
    projectRepository: createProjectRepository({
      async openText() {
        return null;
      },
      async saveText(_text, target) {
        return {
          path: target?.path
        };
      },
      async saveTextAs(_text) {
        return {
          path: 'download.lcproj.json'
        };
      }
    })
  };
}
