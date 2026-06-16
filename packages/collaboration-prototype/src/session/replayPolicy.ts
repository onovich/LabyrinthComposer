import type { ProjectGraph } from '@labyrinth/schema';
import { applyCommand } from '@labyrinth/workbench';

import {
  cloneCollaborationCommandEnvelope,
  type CollaborationCommandEnvelope
} from './commandEnvelope.js';

export type CollaborationReplayOrder = 'created-at-then-id';

export type CollaborationReplayAccepted = {
  status: 'accepted';
  envelope: CollaborationCommandEnvelope;
};

export type CollaborationReplayRejected = {
  status: 'rejected';
  envelope: CollaborationCommandEnvelope;
  reason: string;
};

export type CollaborationReplayEntry = CollaborationReplayAccepted | CollaborationReplayRejected;

export type CollaborationReplayResult = {
  project: ProjectGraph;
  entries: CollaborationReplayEntry[];
};

function compareOptionalText(left: string | undefined, right: string | undefined): number {
  if (left === right) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left.localeCompare(right);
}

export function orderCollaborationCommandEnvelopes(
  envelopes: CollaborationCommandEnvelope[]
): CollaborationCommandEnvelope[] {
  return envelopes
    .map((envelope, deliveryIndex) => ({
      envelope: cloneCollaborationCommandEnvelope(envelope),
      deliveryIndex
    }))
    .sort((left, right) => {
      const createdAtOrder = compareOptionalText(left.envelope.createdAt, right.envelope.createdAt);

      if (createdAtOrder !== 0) {
        return createdAtOrder;
      }

      const idOrder = left.envelope.id.localeCompare(right.envelope.id);

      if (idOrder !== 0) {
        return idOrder;
      }

      return left.deliveryIndex - right.deliveryIndex;
    })
    .map((entry) => entry.envelope);
}

export function replayCollaborationCommandEnvelopes(
  baseProject: ProjectGraph,
  envelopes: CollaborationCommandEnvelope[]
): CollaborationReplayResult {
  let project = baseProject;
  const entries: CollaborationReplayEntry[] = [];

  for (const envelope of orderCollaborationCommandEnvelopes(envelopes)) {
    try {
      project = applyCommand(project, envelope.command).project;
      entries.push({
        status: 'accepted',
        envelope
      });
    } catch (error) {
      entries.push({
        status: 'rejected',
        envelope,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    project,
    entries
  };
}
