import * as Y from 'yjs';

import type { ProjectGraph } from '@labyrinth/schema';
import { applyCommand, type Command } from '@labyrinth/workbench';

export const COLLABORATION_COMMANDS_ARRAY = 'commands';

export type CollaborationCommandRecord = {
  id: string;
  command: Command;
  actorId?: string;
  createdAt?: string;
};

export type CollaborationDoc = {
  doc: Y.Doc;
};

function commandArray(doc: Y.Doc): Y.Array<CollaborationCommandRecord> {
  return doc.getArray<CollaborationCommandRecord>(COLLABORATION_COMMANDS_ARRAY);
}

function cloneRecord(record: CollaborationCommandRecord): CollaborationCommandRecord {
  return JSON.parse(JSON.stringify(record)) as CollaborationCommandRecord;
}

export function createCollaborationDoc(): CollaborationDoc {
  return {
    doc: new Y.Doc()
  };
}

export function appendCommandAsYjsUpdate(
  collaborationDoc: CollaborationDoc,
  record: CollaborationCommandRecord
): Uint8Array {
  const stateBefore = Y.encodeStateVector(collaborationDoc.doc);

  collaborationDoc.doc.transact(() => {
    commandArray(collaborationDoc.doc).push([cloneRecord(record)]);
  });

  return Y.encodeStateAsUpdate(collaborationDoc.doc, stateBefore);
}

export function applyYjsUpdateToDoc(
  collaborationDoc: CollaborationDoc,
  update: Uint8Array
): Command[] {
  const beforeIds = new Set(
    commandArray(collaborationDoc.doc)
      .toArray()
      .map((record) => record.id)
  );

  Y.applyUpdate(collaborationDoc.doc, update);

  return commandArray(collaborationDoc.doc)
    .toArray()
    .filter((record) => !beforeIds.has(record.id))
    .map((record) => cloneRecord(record).command);
}

export function encodeCollaborationState(collaborationDoc: CollaborationDoc): Uint8Array {
  return Y.encodeStateAsUpdate(collaborationDoc.doc);
}

export function getCollaborationCommands(collaborationDoc: CollaborationDoc): Command[] {
  return commandArray(collaborationDoc.doc)
    .toArray()
    .map((record) => cloneRecord(record).command);
}

export function projectFromCollaborationDoc(
  baseProject: ProjectGraph,
  collaborationDoc: CollaborationDoc
): ProjectGraph {
  return getCollaborationCommands(collaborationDoc).reduce(
    (project, command) => applyCommand(project, command).project,
    baseProject
  );
}
