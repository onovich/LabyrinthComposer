import type { EntityRef } from './entities.js';

export type ReviewThreadStatus = 'open' | 'resolved';

export type ReviewComment = {
  id: string;
  author?: string;
  body: string;
  createdAt?: string;
};

export type ReviewThread = {
  id: string;
  target: EntityRef;
  status: ReviewThreadStatus;
  comments: ReviewComment[];
};
