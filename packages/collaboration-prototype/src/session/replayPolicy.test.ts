import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import {
  orderCollaborationCommandEnvelopes,
  replayCollaborationCommandEnvelopes
} from './replayPolicy.js';
import type { CollaborationCommandEnvelope } from './commandEnvelope.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'replay-test',
      name: 'Replay Test'
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
    beats: {},
    reviewThreads: [
      {
        id: 'thread-1',
        target: {
          kind: 'space',
          id: 'start'
        },
        status: 'open',
        comments: [
          {
            id: 'comment-1',
            body: 'Check pacing.',
            createdAt: '2026-06-16T16:00:00.000Z'
          }
        ]
      }
    ]
  };
}

describe('collaboration replay policy', () => {
  it('orders command envelopes deterministically by timestamp and id', () => {
    const envelopes: CollaborationCommandEnvelope[] = [
      {
        id: 'command-b',
        createdAt: '2026-06-16T16:00:00.000Z',
        command: {
          type: 'UpdateSpace',
          payload: {
            id: 'start',
            patch: {
              name: 'Beta'
            }
          }
        }
      },
      {
        id: 'command-a',
        createdAt: '2026-06-16T16:00:00.000Z',
        command: {
          type: 'UpdateSpace',
          payload: {
            id: 'start',
            patch: {
              name: 'Alpha'
            }
          }
        }
      }
    ];

    expect(orderCollaborationCommandEnvelopes(envelopes).map((envelope) => envelope.id)).toEqual([
      'command-a',
      'command-b'
    ]);
  });

  it('replays concurrent edits to the same entity with a stable result', () => {
    const firstLog: CollaborationCommandEnvelope[] = [
      {
        id: 'command-b',
        createdAt: '2026-06-16T16:00:00.000Z',
        command: {
          type: 'UpdateSpace',
          payload: {
            id: 'start',
            patch: {
              name: 'Beta'
            }
          }
        }
      },
      {
        id: 'command-a',
        createdAt: '2026-06-16T16:00:00.000Z',
        command: {
          type: 'UpdateSpace',
          payload: {
            id: 'start',
            patch: {
              name: 'Alpha'
            }
          }
        }
      }
    ];
    const secondLog = [...firstLog].reverse();

    expect(replayCollaborationCommandEnvelopes(projectFixture(), firstLog).project).toEqual(
      replayCollaborationCommandEnvelopes(projectFixture(), secondLog).project
    );
    expect(
      replayCollaborationCommandEnvelopes(projectFixture(), firstLog).project.spaces.start.name
    ).toBe('Beta');
  });

  it('rejects remote edits against removed session entities without recreating them', () => {
    const result = replayCollaborationCommandEnvelopes(projectFixture(), [
      {
        id: 'command-remove-comment',
        createdAt: '2026-06-16T16:00:00.000Z',
        command: {
          type: 'RemoveReviewComment',
          payload: {
            threadId: 'thread-1',
            commentId: 'comment-1'
          }
        }
      },
      {
        id: 'command-remove-comment-again',
        createdAt: '2026-06-16T16:00:01.000Z',
        command: {
          type: 'RemoveReviewComment',
          payload: {
            threadId: 'thread-1',
            commentId: 'comment-1'
          }
        }
      }
    ]);

    expect(result.entries.map((entry) => entry.status)).toEqual(['accepted', 'rejected']);
    expect(result.entries[1]).toEqual(
      expect.objectContaining({
        status: 'rejected',
        reason: 'Review comment "comment-1" does not exist.'
      })
    );
    expect(result.project.reviewThreads?.[0]?.comments).toEqual([]);
  });

  it('keeps the last valid project when a remote command fails replay', () => {
    const result = replayCollaborationCommandEnvelopes(projectFixture(), [
      {
        id: 'command-valid',
        createdAt: '2026-06-16T16:00:00.000Z',
        command: {
          type: 'CreateSpace',
          payload: {
            space: {
              id: 'exit',
              name: 'Exit'
            }
          }
        }
      },
      {
        id: 'command-invalid',
        createdAt: '2026-06-16T16:00:01.000Z',
        command: {
          type: 'UpdateSpace',
          payload: {
            id: 'missing',
            patch: {
              name: 'Should Reject'
            }
          }
        }
      }
    ]);

    expect(result.entries.map((entry) => entry.status)).toEqual(['accepted', 'rejected']);
    expect(result.project.spaces.exit).toEqual({
      id: 'exit',
      name: 'Exit'
    });
    expect(result.project.spaces).not.toHaveProperty('missing');
  });
});
