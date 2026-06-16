import type { EntityRef, ProjectGraph, ReviewComment, ReviewThreadStatus } from '@labyrinth/schema';

export type ReviewCommentViewModel = {
  id: string;
  author?: string;
  body: string;
  createdAt?: string;
};

export type ReviewThreadViewModel = {
  id: string;
  target: EntityRef;
  targetLabel: string;
  targetExists: boolean;
  status: ReviewThreadStatus;
  comments: ReviewCommentViewModel[];
  commentCount: number;
  latestCommentBody?: string;
  isForSelectedEntity: boolean;
};

function sameEntity(left: EntityRef, right: EntityRef): boolean {
  return left.kind === right.kind && left.id === right.id;
}

function entityLabel(project: ProjectGraph, entity: EntityRef): { label: string; exists: boolean } {
  switch (entity.kind) {
    case 'space': {
      const value = project.spaces[entity.id];
      return value === undefined
        ? { label: `Missing space ${entity.id}`, exists: false }
        : { label: value.name, exists: true };
    }
    case 'connection': {
      const value = project.connections[entity.id];
      return value === undefined
        ? { label: `Missing connection ${entity.id}`, exists: false }
        : { label: `${value.fromSpaceId} -> ${value.toSpaceId}`, exists: true };
    }
    case 'gate': {
      const value = project.gates[entity.id];
      return value === undefined
        ? { label: `Missing gate ${entity.id}`, exists: false }
        : { label: value.name, exists: true };
    }
    case 'token': {
      const value = project.tokens[entity.id];
      return value === undefined
        ? { label: `Missing token ${entity.id}`, exists: false }
        : { label: value.name, exists: true };
    }
    case 'puzzle': {
      const value = project.puzzles[entity.id];
      return value === undefined
        ? { label: `Missing puzzle ${entity.id}`, exists: false }
        : { label: value.name, exists: true };
    }
    case 'beat': {
      const value = project.beats[entity.id];
      return value === undefined
        ? { label: `Missing beat ${entity.id}`, exists: false }
        : { label: value.name, exists: true };
    }
  }
}

function latestCommentBody(comments: ReviewComment[]): string | undefined {
  return comments.length === 0 ? undefined : comments[comments.length - 1]?.body;
}

export function createReviewThreadViewModels(
  project: ProjectGraph,
  selectedEntity?: EntityRef | null
): ReviewThreadViewModel[] {
  return (project.reviewThreads ?? [])
    .map((thread): ReviewThreadViewModel => {
      const target = entityLabel(project, thread.target);
      const isForSelectedEntity =
        selectedEntity === undefined || selectedEntity === null
          ? false
          : sameEntity(thread.target, selectedEntity);

      return {
        id: thread.id,
        target: { ...thread.target },
        targetLabel: target.label,
        targetExists: target.exists,
        status: thread.status,
        comments: thread.comments.map((comment) => ({ ...comment })),
        commentCount: thread.comments.length,
        latestCommentBody: latestCommentBody(thread.comments),
        isForSelectedEntity
      };
    })
    .sort(
      (left, right) =>
        Number(right.isForSelectedEntity) - Number(left.isForSelectedEntity) ||
        Number(left.status === 'resolved') - Number(right.status === 'resolved') ||
        left.id.localeCompare(right.id)
    );
}
