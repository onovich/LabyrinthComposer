import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph, type ValidationResult } from '@labyrinth/schema';

import { createExportViewModel } from './exportSelectors.js';

describe('createExportViewModel', () => {
  it('summarizes engine export scope from project and validation data', () => {
    const project: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'export-view',
        name: 'Export View'
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
    const validation: ValidationResult = {
      ok: true,
      reachableSpaces: ['start'],
      acquiredTokens: [],
      openedGates: [],
      solvedPuzzles: [],
      trace: [],
      diagnostics: []
    };

    expect(createExportViewModel(project, validation)).toEqual({
      projectName: 'Export View',
      spaces: 1,
      connections: 0,
      gates: 0,
      tokens: 0,
      puzzles: 0,
      beats: 0,
      diagnostics: 0,
      validationOk: true
    });
  });
});
