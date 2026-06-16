import type { Command } from '@labyrinth/workbench';

export type CollaborationCommandEnvelope = {
  id: string;
  actorId?: string;
  createdAt?: string;
  command: Command;
};

export function cloneCollaborationCommandEnvelope(
  envelope: CollaborationCommandEnvelope
): CollaborationCommandEnvelope {
  return JSON.parse(JSON.stringify(envelope)) as CollaborationCommandEnvelope;
}

export function serializeCollaborationCommandEnvelope(
  envelope: CollaborationCommandEnvelope
): string {
  return JSON.stringify(cloneCollaborationCommandEnvelope(envelope));
}

export function parseCollaborationCommandEnvelope(json: string): CollaborationCommandEnvelope {
  const parsed = JSON.parse(json) as CollaborationCommandEnvelope;

  return cloneCollaborationCommandEnvelope(parsed);
}
