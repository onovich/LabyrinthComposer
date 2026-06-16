export type CollaborationGateStatus = 'experiment-only' | 'accepted-for-productization';

export type CollaborationDecisionGate = {
  status: CollaborationGateStatus;
  decisionRecordPath: string;
  prototypePackage: '@labyrinth/collaboration-prototype';
  mayLoadInMainDesktop: boolean;
  mayDependFromWorkbench: boolean;
  mayPersistPresenceInProjectGraph: boolean;
  requiredBeforeProductization: string[];
};

export const COLLABORATION_DECISION_RECORD_PATH = 'docs/collaboration-decision-record.md';

export const COLLABORATION_DECISION_GATE: CollaborationDecisionGate = {
  status: 'experiment-only',
  decisionRecordPath: COLLABORATION_DECISION_RECORD_PATH,
  prototypePackage: '@labyrinth/collaboration-prototype',
  mayLoadInMainDesktop: false,
  mayDependFromWorkbench: false,
  mayPersistPresenceInProjectGraph: false,
  requiredBeforeProductization: [
    'Conflict semantics for simultaneous edits',
    'Presence privacy and retention policy',
    'Provider selection and offline behavior',
    'Migration plan for collaboration metadata',
    'Explicit product acceptance phase'
  ]
};

export function canEnableCollaborationByDefault(gate = COLLABORATION_DECISION_GATE): boolean {
  return (
    gate.status !== 'experiment-only' &&
    gate.mayLoadInMainDesktop &&
    gate.mayDependFromWorkbench &&
    gate.mayPersistPresenceInProjectGraph
  );
}
