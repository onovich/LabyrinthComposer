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
});
