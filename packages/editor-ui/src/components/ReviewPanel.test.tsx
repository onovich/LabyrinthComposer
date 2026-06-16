import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReviewPanel } from './ReviewPanel.js';

describe('ReviewPanel', () => {
  it('renders entity review threads and comment actions', () => {
    const html = renderToStaticMarkup(
      <ReviewPanel
        selectedEntity={{
          kind: 'space',
          id: 'start'
        }}
        summary={{
          totalThreads: 1,
          openThreads: 1,
          resolvedThreads: 0,
          commentCount: 1,
          entities: []
        }}
        threads={[
          {
            id: 'review-start',
            target: {
              kind: 'space',
              id: 'start'
            },
            targetLabel: 'Start',
            targetExists: true,
            status: 'open',
            comments: [
              {
                id: 'comment-1',
                body: 'Clarify the entry prompt.'
              }
            ],
            commentCount: 1,
            latestCommentBody: 'Clarify the entry prompt.',
            isForSelectedEntity: true
          }
        ]}
        onAddComment={() => undefined}
        onAddThread={() => undefined}
        onRemoveComment={() => undefined}
        onSelectTarget={() => undefined}
        onUpdateThreadStatus={() => undefined}
      />
    );

    expect(html).toContain('Review');
    expect(html).toContain('space:start');
    expect(html).toContain('Clarify the entry prompt.');
    expect(html).toContain('Resolve');
  });
});
