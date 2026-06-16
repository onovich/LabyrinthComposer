import type { EntityRef, ReviewThreadStatus } from '@labyrinth/schema';
import type { ReviewSummary, ReviewThreadViewModel } from '@labyrinth/workbench';
import { CheckCircle2, MessageSquarePlus, RotateCcw, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

type ReviewPanelProps = {
  threads: ReviewThreadViewModel[];
  summary: ReviewSummary;
  selectedEntity: EntityRef | null;
  onAddThread(target: EntityRef): void;
  onSelectTarget(target: EntityRef): void;
  onUpdateThreadStatus(id: string, status: ReviewThreadStatus): void;
  onAddComment(threadId: string, body: string): void;
  onRemoveComment(threadId: string, commentId: string): void;
};

function entityKey(entity: EntityRef): string {
  return `${entity.kind}:${entity.id}`;
}

export function ReviewPanel({
  threads,
  summary,
  selectedEntity,
  onAddThread,
  onSelectTarget,
  onUpdateThreadStatus,
  onAddComment,
  onRemoveComment
}: ReviewPanelProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function submitComment(threadId: string) {
    const body = drafts[threadId]?.trim();

    if (body === undefined || body.length === 0) {
      return;
    }

    onAddComment(threadId, body);
    setDrafts((current) => ({
      ...current,
      [threadId]: ''
    }));
  }

  return (
    <section className="lc-panel-section">
      <div className="lc-review-heading">
        <div>
          <div className="lc-section-label">Review</div>
          <div className="lc-review-target">
            {selectedEntity === null ? 'No entity selected' : entityKey(selectedEntity)}
          </div>
        </div>
        <button
          className="lc-tool-button lc-tool-button-primary"
          disabled={selectedEntity === null}
          onClick={() => selectedEntity !== null && onAddThread(selectedEntity)}
          title="Add review thread"
          type="button"
        >
          <MessageSquarePlus size={14} />
          Thread
        </button>
      </div>
      <div className="lc-review-summary" aria-label="Review summary">
        <div>
          <span>Open</span>
          <strong>{summary.openThreads}</strong>
        </div>
        <div>
          <span>Resolved</span>
          <strong>{summary.resolvedThreads}</strong>
        </div>
        <div>
          <span>Comments</span>
          <strong>{summary.commentCount}</strong>
        </div>
      </div>
      <div className="lc-review-list" aria-label="Review threads">
        {threads.length === 0 ? (
          <div className="lc-review-empty">No review threads</div>
        ) : (
          threads.map((thread) => (
            <article
              className={`lc-review-thread ${thread.isForSelectedEntity ? 'lc-review-thread-focused' : ''}`}
              key={thread.id}
            >
              <div className="lc-review-thread-header">
                <button
                  className="lc-review-target-button"
                  onClick={() => onSelectTarget(thread.target)}
                  type="button"
                >
                  <strong>{thread.targetLabel}</strong>
                  <span>
                    {entityKey(thread.target)}
                    {thread.targetExists ? '' : ' missing'}
                  </span>
                </button>
                <button
                  className="lc-inline-action"
                  onClick={() =>
                    onUpdateThreadStatus(thread.id, thread.status === 'open' ? 'resolved' : 'open')
                  }
                  type="button"
                >
                  {thread.status === 'open' ? <CheckCircle2 size={12} /> : <RotateCcw size={12} />}
                  {thread.status === 'open' ? 'Resolve' : 'Reopen'}
                </button>
              </div>
              <div className="lc-review-comments">
                {thread.comments.length === 0 ? (
                  <span className="lc-review-empty">No comments</span>
                ) : (
                  thread.comments.map((comment) => (
                    <div className="lc-review-comment" key={comment.id}>
                      <p>{comment.body}</p>
                      <div>
                        <span>{comment.author ?? comment.createdAt ?? comment.id}</span>
                        <button
                          className="lc-icon-button"
                          onClick={() => onRemoveComment(thread.id, comment.id)}
                          title="Remove comment"
                          type="button"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="lc-review-compose">
                <textarea
                  aria-label={`Add comment to ${thread.id}`}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [thread.id]: event.target.value
                    }))
                  }
                  value={drafts[thread.id] ?? ''}
                />
                <button
                  className="lc-tool-button"
                  onClick={() => submitComment(thread.id)}
                  type="button"
                >
                  <Send size={14} />
                  Add
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
