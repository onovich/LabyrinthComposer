export type CollaborationGateStatus =
  | 'experiment-only'
  | 'candidate-session-collaboration'
  | 'accepted-for-productization';
export type CollaborationPresencePolicy = 'session-only';
export type CollaborationProviderStatePolicy = 'host-session-only';

export type CollaborationDecisionGate = {
  status: CollaborationGateStatus;
  decisionRecordPath: string;
  prototypePackage: '@labyrinth/collaboration-prototype';
  mayLoadInMainDesktop: boolean;
  workbenchRemainsCollaborationFree: boolean;
  presencePolicy: CollaborationPresencePolicy;
  providerStatePolicy: CollaborationProviderStatePolicy;
  projectGraphStoresPresence: false;
  requiredBeforeProductization: string[];
};

export const COLLABORATION_DECISION_RECORD_PATH = 'docs/collaboration-decision-record.md';

export const COLLABORATION_DECISION_GATE: CollaborationDecisionGate = {
  status: 'experiment-only',
  decisionRecordPath: COLLABORATION_DECISION_RECORD_PATH,
  prototypePackage: '@labyrinth/collaboration-prototype',
  mayLoadInMainDesktop: false,
  workbenchRemainsCollaborationFree: true,
  presencePolicy: 'session-only',
  providerStatePolicy: 'host-session-only',
  projectGraphStoresPresence: false,
  requiredBeforeProductization: [
    'Conflict semantics for simultaneous edits',
    'Presence privacy and retention policy',
    'Provider selection and offline behavior',
    'Migration plan for collaboration metadata',
    'Explicit product acceptance phase'
  ]
};

export function keepsPresenceOutOfProjectGraph(gate = COLLABORATION_DECISION_GATE): boolean {
  return gate.presencePolicy === 'session-only' && gate.projectGraphStoresPresence === false;
}

export function canEnableCollaborationByDefault(gate = COLLABORATION_DECISION_GATE): boolean {
  return (
    gate.status === 'accepted-for-productization' &&
    gate.mayLoadInMainDesktop &&
    gate.workbenchRemainsCollaborationFree &&
    keepsPresenceOutOfProjectGraph(gate) &&
    gate.providerStatePolicy === 'host-session-only' &&
    gate.requiredBeforeProductization.length === 0
  );
}
