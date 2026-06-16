import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import {
  appendCommandAsYjsUpdate,
  applyYjsUpdateToDoc,
  createCollaborationDoc,
  encodeCollaborationState,
  getCollaborationCommands,
  projectFromCollaborationDoc
} from './entityGraphAdapter.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'collaboration-test',
      name: 'Collaboration Test'
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

describe('entity graph collaboration adapter', () => {
  it('maps serializable commands to Yjs updates and replays them into ProjectGraph', () => {
    const baseProject = projectFixture();
    const clientA = createCollaborationDoc();
    const clientB = createCollaborationDoc();
    const createExitUpdate = appendCommandAsYjsUpdate(clientA, {
      id: 'command-1',
      actorId: 'designer-a',
      command: {
        type: 'CreateSpace',
        payload: {
          space: {
            id: 'exit',
            name: 'Exit'
          },
          addToTargets: true
        }
      }
    });

    expect(applyYjsUpdateToDoc(clientB, createExitUpdate)).toEqual([
      {
        type: 'CreateSpace',
        payload: {
          space: {
            id: 'exit',
            name: 'Exit'
          },
          addToTargets: true
        }
      }
    ]);

    const connectUpdate = appendCommandAsYjsUpdate(clientB, {
      id: 'command-2',
      actorId: 'designer-b',
      command: {
        type: 'ConnectSpaces',
        payload: {
          connection: {
            id: 'start-exit',
            fromSpaceId: 'start',
            toSpaceId: 'exit'
          }
        }
      }
    });

    applyYjsUpdateToDoc(clientA, connectUpdate);

    expect(projectFromCollaborationDoc(baseProject, clientA)).toEqual(
      expect.objectContaining({
        targetSpaceIds: ['exit', 'start'],
        spaces: expect.objectContaining({
          exit: {
            id: 'exit',
            name: 'Exit'
          }
        }),
        connections: expect.objectContaining({
          'start-exit': {
            id: 'start-exit',
            fromSpaceId: 'start',
            toSpaceId: 'exit'
          }
        })
      })
    );
  });

  it('can hydrate a second client from an encoded collaboration state', () => {
    const baseProject = projectFixture();
    const clientA = createCollaborationDoc();
    const clientB = createCollaborationDoc();

    appendCommandAsYjsUpdate(clientA, {
      id: 'command-1',
      command: {
        type: 'CreateToken',
        payload: {
          token: {
            id: 'key',
            name: 'Key',
            kind: 'item',
            locationSpaceId: 'start'
          }
        }
      }
    });

    const commands = applyYjsUpdateToDoc(clientB, encodeCollaborationState(clientA));

    expect(commands).toHaveLength(1);
    expect(getCollaborationCommands(clientB)).toEqual(getCollaborationCommands(clientA));
    expect(projectFromCollaborationDoc(baseProject, clientB).tokens.key).toEqual({
      id: 'key',
      name: 'Key',
      kind: 'item',
      locationSpaceId: 'start'
    });
  });
});
