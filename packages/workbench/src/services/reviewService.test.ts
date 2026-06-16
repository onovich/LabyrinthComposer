import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import { createReviewSummary } from './reviewService.js';

describe('createReviewSummary', () => {
  it('summarizes thread status and comments by EntityRef target', () => {
    const project: ProjectGraph = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'review-service-test',
        name: 'Review Service Test'
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
          id: 'review-1',
          target: {
            kind: 'space',
            id: 'start'
          },
          status: 'open',
          comments: [{ id: 'comment-1', body: 'Needs a hook.' }]
        },
        {
          id: 'review-2',
          target: {
            kind: 'space',
            id: 'start'
          },
          status: 'resolved',
          comments: [{ id: 'comment-2', body: 'Resolved.' }]
        }
      ]
    };

    expect(createReviewSummary(project)).toEqual({
      totalThreads: 2,
      openThreads: 1,
      resolvedThreads: 1,
      commentCount: 2,
      entities: [
        {
          target: {
            kind: 'space',
            id: 'start'
          },
          openThreads: 1,
          resolvedThreads: 1,
          commentCount: 2
        }
      ]
    });
  });
});
