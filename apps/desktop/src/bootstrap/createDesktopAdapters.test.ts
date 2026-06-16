import { describe, expect, it } from 'vitest';

import { createDesktopAdapters, type TauriProjectFileClient } from './createDesktopAdapters.js';
import horrorClinicProjectText from '../../../../packages/test-fixtures/samples/horror-clinic.lcproj.json?raw';

function createTauriClient(
  overrides: Partial<TauriProjectFileClient> = {}
): TauriProjectFileClient {
  return {
    isAvailable: () => true,
    async openProjectFile() {
      return {
        text: horrorClinicProjectText,
        path: 'D:\\Projects\\horror-clinic.lcproj.json'
      };
    },
    async saveProjectFile(_text, path) {
      return {
        path
      };
    },
    async saveProjectFileAs() {
      return {
        path: 'D:\\Projects\\horror-clinic-copy.lcproj.json'
      };
    },
    async saveReportFileAs(_text, format) {
      return {
        path:
          format === 'json'
            ? 'D:\\Projects\\horror-clinic-report.json'
            : 'D:\\Projects\\horror-clinic-report.md'
      };
    },
    async saveEngineExportFileAs() {
      return {
        path: 'D:\\Projects\\engine-export.json'
      };
    },
    ...overrides
  };
}

describe('desktop adapters', () => {
  it('opens the bundled sample in browser fallback mode', async () => {
    const adapters = createDesktopAdapters({
      ...createTauriClient(),
      isAvailable: () => false
    });
    const result = await adapters.projectRepository.openProject();

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        path: 'packages/test-fixtures/samples/horror-clinic.lcproj.json'
      })
    );
  });

  it('opens and saves a Tauri-selected project through the repository parser', async () => {
    let savedText = '';
    const adapters = createDesktopAdapters(
      createTauriClient({
        async saveProjectFile(text, path) {
          savedText = text;
          return {
            path
          };
        }
      })
    );

    const openResult = await adapters.projectRepository.openProject();

    expect(openResult).toEqual(
      expect.objectContaining({
        ok: true,
        path: 'D:\\Projects\\horror-clinic.lcproj.json'
      })
    );

    if (!openResult.ok) {
      throw new Error(openResult.message);
    }

    const saveResult = await adapters.projectRepository.saveProject(openResult.project, {
      path: openResult.path
    });

    expect(saveResult).toEqual(
      expect.objectContaining({
        ok: true,
        path: 'D:\\Projects\\horror-clinic.lcproj.json'
      })
    );
    expect(savedText).toContain('"schemaVersion": "0.1.0"');
  });

  it('reports a cancelled Tauri save-as without marking a save path', async () => {
    const adapters = createDesktopAdapters(
      createTauriClient({
        async saveProjectFileAs() {
          return null;
        }
      })
    );
    const openResult = await adapters.projectRepository.openProject();

    if (!openResult.ok) {
      throw new Error(openResult.message);
    }

    const saveResult = await adapters.projectRepository.saveProjectAs(openResult.project);

    expect(saveResult).toEqual({
      ok: false,
      message: 'Project save failed: Error: Project save was cancelled.'
    });
  });

  it('saves Markdown reports through the Tauri report save dialog', async () => {
    let savedText = '';
    const adapters = createDesktopAdapters(
      createTauriClient({
        async saveReportFileAs(text, format) {
          savedText = text;
          return {
            path:
              format === 'markdown'
                ? 'D:\\Projects\\horror-clinic-report.md'
                : 'D:\\Projects\\horror-clinic-report.json'
          };
        }
      })
    );

    const result = await adapters.reportRepository.saveReportAs('# Report', 'markdown');

    expect(result).toEqual({
      ok: true,
      path: 'D:\\Projects\\horror-clinic-report.md'
    });
    expect(savedText).toBe('# Report');
  });

  it('reports a cancelled Tauri report save-as', async () => {
    const adapters = createDesktopAdapters(
      createTauriClient({
        async saveReportFileAs() {
          return null;
        }
      })
    );

    await expect(adapters.reportRepository.saveReportAs('{}', 'json')).resolves.toEqual({
      ok: false,
      message: 'Report save failed: Error: Report save was cancelled.'
    });
  });

  it('saves engine JSON exports through the Tauri engine export dialog', async () => {
    let savedText = '';
    const adapters = createDesktopAdapters(
      createTauriClient({
        async saveEngineExportFileAs(text) {
          savedText = text;
          return {
            path: 'D:\\Projects\\engine-export.json'
          };
        }
      })
    );

    await expect(
      adapters.engineExportRepository.saveEngineExportAs('{"exportVersion":"0.1.0"}')
    ).resolves.toEqual({
      ok: true,
      path: 'D:\\Projects\\engine-export.json'
    });
    expect(savedText).toContain('exportVersion');
  });

  it('reports a cancelled Tauri engine export save-as', async () => {
    const adapters = createDesktopAdapters(
      createTauriClient({
        async saveEngineExportFileAs() {
          return null;
        }
      })
    );

    await expect(adapters.engineExportRepository.saveEngineExportAs('{}')).resolves.toEqual({
      ok: false,
      message: 'Engine export save failed: Error: Engine export save was cancelled.'
    });
  });
});
