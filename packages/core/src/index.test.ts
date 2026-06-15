import { describe, expect, it } from 'vitest';

import { createEmptyProject, SCHEMA_VERSION } from '@labyrinth/schema';

import { validateProject } from './index.js';

describe('phase 0 smoke', () => {
  it('exports schema and core validation entry points', () => {
    const project = createEmptyProject();
    const result = validateProject(project);

    expect(project.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });
});
