import type { EntityRef, ProjectGraph } from '@labyrinth/schema';

export type ReviewEntitySummary = {
  target: EntityRef;
  openThreads: number;
  resolvedThreads: number;
  commentCount: number;
};

export type ReviewSummary = {
  totalThreads: number;
  openThreads: number;
  resolvedThreads: number;
  commentCount: number;
  entities: ReviewEntitySummary[];
};

function entityKey(entity: EntityRef): string {
  return `${entity.kind}:${entity.id}`;
}

export function createReviewSummary(project: ProjectGraph): ReviewSummary {
  const entities = new Map<string, ReviewEntitySummary>();
  let openThreads = 0;
  let resolvedThreads = 0;
  let commentCount = 0;

  for (const thread of project.reviewThreads ?? []) {
    if (thread.status === 'resolved') {
      resolvedThreads += 1;
    } else {
      openThreads += 1;
    }

    commentCount += thread.comments.length;

    const key = entityKey(thread.target);
    const existing = entities.get(key) ?? {
      target: { ...thread.target },
      openThreads: 0,
      resolvedThreads: 0,
      commentCount: 0
    };

    if (thread.status === 'resolved') {
      existing.resolvedThreads += 1;
    } else {
      existing.openThreads += 1;
    }

    existing.commentCount += thread.comments.length;
    entities.set(key, existing);
  }

  return {
    totalThreads: openThreads + resolvedThreads,
    openThreads,
    resolvedThreads,
    commentCount,
    entities: [...entities.values()].sort((left, right) =>
      entityKey(left.target).localeCompare(entityKey(right.target))
    )
  };
}
