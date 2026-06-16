import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';
import { applyCommand } from '@labyrinth/workbench';

import {
  cloneCollaborationCommandEnvelope,
  parseCollaborationCommandEnvelope,
  serializeCollaborationCommandEnvelope,
  type CollaborationCommandEnvelope
} from './commandEnvelope.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'envelope-test',
      name: 'Envelope Test'
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

describe('collaboration command envelope', () => {
  it('serializes and parses session metadata around a workbench command', () => {
    const envelope: CollaborationCommandEnvelope = {
      id: 'command-1',
      actorId: 'designer-a',
      createdAt: '2026-06-16T16:00:00.000Z',
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
    };

    expect(
      parseCollaborationCommandEnvelope(serializeCollaborationCommandEnvelope(envelope))
    ).toEqual(envelope);
  });

  it('clones envelopes without sharing command payload references', () => {
    const envelope: CollaborationCommandEnvelope = {
      id: 'command-1',
      command: {
        type: 'UpdateSpace',
        payload: {
          id: 'start',
          patch: {
            name: 'Renamed Start'
          }
        }
      }
    };
    const clone = cloneCollaborationCommandEnvelope(envelope);

    if (clone.command.type !== 'UpdateSpace') {
      throw new Error('Unexpected command type in clone.');
    }

    clone.command.payload.patch.name = 'Changed Clone';

    expect(envelope.command).toEqual({
      type: 'UpdateSpace',
      payload: {
        id: 'start',
        patch: {
          name: 'Renamed Start'
        }
      }
    });
  });

  it('replays only the command into ProjectGraph and leaves actor metadata in the session layer', () => {
    const envelope: CollaborationCommandEnvelope = {
      id: 'command-1',
      actorId: 'designer-a',
      createdAt: '2026-06-16T16:00:00.000Z',
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
    };

    const project = applyCommand(projectFixture(), envelope.command).project;

    expect(project.tokens.key).toEqual({
      id: 'key',
      name: 'Key',
      kind: 'item',
      locationSpaceId: 'start'
    });
    expect(JSON.stringify(project)).not.toContain('designer-a');
    expect(JSON.stringify(project)).not.toContain('createdAt');
  });

  it('allows anonymous session envelopes without changing edit semantics', () => {
    const envelope: CollaborationCommandEnvelope = {
      id: 'command-1',
      command: {
        type: 'UpdateSpace',
        payload: {
          id: 'start',
          patch: {
            name: 'Anonymous Edit'
          }
        }
      }
    };

    const project = applyCommand(projectFixture(), envelope.command).project;

    expect(project.spaces.start.name).toBe('Anonymous Edit');
  });
});
