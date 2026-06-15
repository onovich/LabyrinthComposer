import {
  migrateProjectToCurrent,
  parseProjectGraph,
  type ProjectGraph,
  type SchemaIssue
} from '@labyrinth/schema';

export type SaveTarget = {
  path?: string;
};

export type OpenProjectTextResult = {
  text: string;
  path?: string;
};

export type SaveProjectTextResult = {
  path?: string;
};

export type ProjectRepositoryAdapter = {
  openText(): Promise<OpenProjectTextResult | null>;
  saveText(text: string, target?: SaveTarget): Promise<SaveProjectTextResult>;
  saveTextAs(text: string): Promise<SaveProjectTextResult>;
};

export type ProjectOpenResult =
  | {
      ok: true;
      project: ProjectGraph;
      path?: string;
    }
  | {
      ok: false;
      message: string;
      issues?: SchemaIssue[];
    };

export type ProjectSaveResult =
  | {
      ok: true;
      path?: string;
    }
  | {
      ok: false;
      message: string;
    };

export type ProjectRepository = {
  openProject(): Promise<ProjectOpenResult>;
  saveProject(project: ProjectGraph, target?: SaveTarget): Promise<ProjectSaveResult>;
  saveProjectAs(project: ProjectGraph): Promise<ProjectSaveResult>;
};

export function serializeProject(project: ProjectGraph): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function parseProjectText(text: string): ProjectOpenResult {
  let value: unknown;

  try {
    value = JSON.parse(text) as unknown;
  } catch (error) {
    return {
      ok: false,
      message: `Project JSON parse failed: ${String(error)}`
    };
  }

  const migrated = migrateProjectToCurrent(value);

  if (!migrated.ok) {
    return {
      ok: false,
      message: migrated.message
    };
  }

  const parsed = parseProjectGraph(migrated.value);

  if (!parsed.ok) {
    return {
      ok: false,
      message: 'Project schema validation failed.',
      issues: parsed.issues
    };
  }

  return {
    ok: true,
    project: parsed.project
  };
}

function saveFailure(error: unknown): ProjectSaveResult {
  return {
    ok: false,
    message: `Project save failed: ${String(error)}`
  };
}

export function createProjectRepository(adapter: ProjectRepositoryAdapter): ProjectRepository {
  return {
    async openProject() {
      const opened = await adapter.openText();

      if (opened === null) {
        return {
          ok: false,
          message: 'Project open was cancelled.'
        };
      }

      const parsed = parseProjectText(opened.text);

      if (!parsed.ok) {
        return parsed;
      }

      return {
        ...parsed,
        path: opened.path
      };
    },
    async saveProject(project, target) {
      try {
        return {
          ok: true,
          ...(await adapter.saveText(serializeProject(project), target))
        };
      } catch (error) {
        return saveFailure(error);
      }
    },
    async saveProjectAs(project) {
      try {
        return {
          ok: true,
          ...(await adapter.saveTextAs(serializeProject(project)))
        };
      } catch (error) {
        return saveFailure(error);
      }
    }
  };
}
