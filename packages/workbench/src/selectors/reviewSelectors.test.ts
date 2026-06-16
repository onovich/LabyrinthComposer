import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';

import { createReviewThreadViewModels } from './reviewSelectors.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'review-selector-test',
      name: 'Review Selector Test'
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
        id: 'review-missing',
        target: {
          kind: 'token',
          id: 'lost-key'
        },
        status: 'open',
        comments: []
      },
      {
        id: 'review-start',
        target: {
          kind: 'space',
          id: 'start'
        },
        status: 'resolved',
        comments: [
          {
            id: 'comment-1',
            body: 'Entry naming is approved.'
          }
        ]
      }
    ]
  };
}

describe('createReviewThreadViewModels', () => {
  it('projects review threads without treating missing targets as validation state', () => {
    const viewModel = createReviewThreadViewModels(projectFixture(), {
      kind: 'space',
      id: 'start'
    });

    expect(viewModel[0]).toEqual(
      expect.objectContaining({
        id: 'review-start',
        targetLabel: 'Start',
        targetExists: true,
        isForSelectedEntity: true,
        latestCommentBody: 'Entry naming is approved.'
      })
    );
    expect(viewModel[1]).toEqual(
      expect.objectContaining({
        id: 'review-missing',
        targetLabel: 'Missing token lost-key',
        targetExists: false
      })
    );
  });
});
