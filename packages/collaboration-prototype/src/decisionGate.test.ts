import { describe, expect, it } from 'vitest';

import {
  canEnableCollaborationByDefault,
  COLLABORATION_DECISION_GATE,
  COLLABORATION_DECISION_RECORD_PATH,
  keepsPresenceOutOfProjectGraph,
  type CollaborationDecisionGate
} from './decisionGate.js';

describe('collaboration decision gate', () => {
  it('keeps collaboration experimental unless a later phase explicitly productizes it', () => {
    expect(COLLABORATION_DECISION_GATE).toEqual(
      expect.objectContaining({
        status: 'experiment-only',
        decisionRecordPath: COLLABORATION_DECISION_RECORD_PATH,
        prototypePackage: '@labyrinth/collaboration-prototype',
        mayLoadInMainDesktop: false,
        workbenchRemainsCollaborationFree: true,
        presencePolicy: 'session-only',
        providerStatePolicy: 'host-session-only',
        projectGraphStoresPresence: false
      })
    );
    expect(COLLABORATION_DECISION_GATE.requiredBeforeProductization).toContain(
      'Conflict semantics for simultaneous edits'
    );
    expect(canEnableCollaborationByDefault()).toBe(false);
    expect(keepsPresenceOutOfProjectGraph()).toBe(true);
  });

  it('allows productization only when presence remains session-only', () => {
    const acceptedGate: CollaborationDecisionGate = {
      ...COLLABORATION_DECISION_GATE,
      status: 'accepted-for-productization',
      mayLoadInMainDesktop: true,
      requiredBeforeProductization: []
    };

    expect(keepsPresenceOutOfProjectGraph(acceptedGate)).toBe(true);
    expect(canEnableCollaborationByDefault(acceptedGate)).toBe(true);
  });

  it('blocks accepted gates that try to store presence in ProjectGraph', () => {
    const invalidAcceptedGate = {
      ...COLLABORATION_DECISION_GATE,
      status: 'accepted-for-productization',
      mayLoadInMainDesktop: true,
      projectGraphStoresPresence: true,
      requiredBeforeProductization: []
    } as unknown as CollaborationDecisionGate;

    expect(keepsPresenceOutOfProjectGraph(invalidAcceptedGate)).toBe(false);
    expect(canEnableCollaborationByDefault(invalidAcceptedGate)).toBe(false);
  });
});
