import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import { createWorkbenchStore } from './createWorkbenchStore.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'store-test',
      name: 'Store Test'
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

describe('workbench store', () => {
  it('updates the canonical project through commands and revalidates', () => {
    const store = createWorkbenchStore(projectFixture());
    const snapshot = store.dispatch({
      type: 'CreateSpace',
      payload: {
        space: {
          id: 'exit',
          name: 'Exit'
        },
        addToTargets: true
      }
    });

    expect(snapshot.dirty).toBe(true);
    expect(snapshot.project.spaces.exit).toEqual({ id: 'exit', name: 'Exit' });
    expect(snapshot.validation.ok).toBe(false);
    expect(snapshot.validation.diagnostics.map((diagnostic) => diagnostic.ruleId)).toContain(
      'reachability.target-unreachable'
    );
  });

  it('loads a project without marking the store dirty', () => {
    const store = createWorkbenchStore(projectFixture());
    const nextProject = {
      ...projectFixture(),
      project: {
        id: 'loaded',
        name: 'Loaded Project'
      }
    };

    store.dispatch({
      type: 'CreateSpace',
      payload: {
        space: {
          id: 'dirty',
          name: 'Dirty'
        }
      }
    });

    const snapshot = store.loadProject(nextProject);

    expect(snapshot.dirty).toBe(false);
    expect(snapshot.project.project.name).toBe('Loaded Project');
  });

  it('can mark a saved project clean without changing validation output', () => {
    const store = createWorkbenchStore(projectFixture());

    store.dispatch({
      type: 'CreateSpace',
      payload: {
        space: {
          id: 'draft',
          name: 'Draft'
        },
        addToTargets: true
      }
    });

    const snapshot = store.markSaved();

    expect(snapshot.dirty).toBe(false);
    expect(snapshot.project.spaces.draft).toEqual({ id: 'draft', name: 'Draft' });
    expect(snapshot.validation.diagnostics.map((diagnostic) => diagnostic.ruleId)).toContain(
      'reachability.target-unreachable'
    );
  });

  it('revalidates snapshots with the selected rule preset and project exceptions', () => {
    const project = {
      ...projectFixture(),
      beats: {
        a: {
          id: 'a',
          name: 'A',
          intensity: 0.5,
          order: 1
        },
        b: {
          id: 'b',
          name: 'B',
          intensity: 0.51,
          order: 2
        },
        c: {
          id: 'c',
          name: 'C',
          intensity: 0.52,
          order: 3
        }
      }
    } satisfies ProjectGraph;
    const store = createWorkbenchStore(project);

    expect(store.getSnapshot().validation.diagnostics).toEqual([]);

    const snapshot = store.dispatch({
      type: 'SetRulePreset',
      payload: {
        rulePresetId: 'horror.clinic'
      }
    });

    expect(snapshot.rulePreset.id).toBe('horror.clinic');
    expect(snapshot.validation.diagnostics.map((diagnostic) => diagnostic.ruleId)).toContain(
      'timeline.intensity-flat'
    );
  });
});
