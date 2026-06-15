import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import {
  createProjectRepository,
  serializeProject,
  type ProjectRepositoryAdapter
} from './projectRepository.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'repository-test',
      name: 'Repository Test'
    },
    startSpaceId: 'start',
    targetSpaceIds: ['start'],
    spaces: {
      start: {
        id: 'start',
        name: 'Start'
      }
    },
    connections: {},
    gates: {},
    tokens: {},
    puzzles: {},
    beats: {}
  };
}

function createMemoryAdapter(
  text: string
): ProjectRepositoryAdapter & { savedText: string | null } {
  return {
    savedText: null,
    async openText() {
      return {
        text,
        path: 'memory/project.lcproj.json'
      };
    },
    async saveText(nextText) {
      this.savedText = nextText;
      return {
        path: 'memory/project.lcproj.json'
      };
    },
    async saveTextAs(nextText) {
      this.savedText = nextText;
      return {
        path: 'memory/project-copy.lcproj.json'
      };
    }
  };
}

describe('project repository', () => {
  it('opens and parses project text through an adapter', async () => {
    const adapter = createMemoryAdapter(serializeProject(projectFixture()));
    const repository = createProjectRepository(adapter);
    const result = await repository.openProject();

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        path: 'memory/project.lcproj.json'
      })
    );
  });

  it('saves stable two-space JSON and can parse it again', async () => {
    const adapter = createMemoryAdapter(serializeProject(projectFixture()));
    const repository = createProjectRepository(adapter);
    const saveResult = await repository.saveProjectAs(projectFixture());

    expect(saveResult).toEqual(
      expect.objectContaining({
        ok: true,
        path: 'memory/project-copy.lcproj.json'
      })
    );
    expect(adapter.savedText).toBe(serializeProject(projectFixture()));

    const roundTrip = createProjectRepository(createMemoryAdapter(adapter.savedText ?? ''));
    const openResult = await roundTrip.openProject();

    expect(openResult.ok).toBe(true);
  });

  it('returns schema issues for malformed project files', async () => {
    const repository = createProjectRepository(createMemoryAdapter('{"schemaVersion":"0.1.0"}'));
    const result = await repository.openProject();

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        message: 'Project schema validation failed.'
      })
    );
  });
});
