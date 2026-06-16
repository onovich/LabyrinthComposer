import { describe, expect, it } from 'vitest';

import {
  canEnableCollaborationByDefault,
  COLLABORATION_DECISION_GATE,
  COLLABORATION_DECISION_RECORD_PATH
} from './decisionGate.js';

describe('collaboration decision gate', () => {
  it('keeps collaboration experimental unless a later phase explicitly productizes it', () => {
    expect(COLLABORATION_DECISION_GATE).toEqual(
      expect.objectContaining({
        status: 'experiment-only',
        decisionRecordPath: COLLABORATION_DECISION_RECORD_PATH,
        prototypePackage: '@labyrinth/collaboration-prototype',
        mayLoadInMainDesktop: false,
        mayDependFromWorkbench: false,
        mayPersistPresenceInProjectGraph: false
      })
    );
    expect(COLLABORATION_DECISION_GATE.requiredBeforeProductization).toContain(
      'Conflict semantics for simultaneous edits'
    );
    expect(canEnableCollaborationByDefault()).toBe(false);
  });
});
