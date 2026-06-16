import type {
  Beat,
  Connection,
  ConnectionId,
  DiagnosticException,
  Gate,
  GateId,
  ProjectGraph,
  Puzzle,
  PuzzleId,
  ReviewComment,
  ReviewThread,
  ReviewThreadStatus,
  RulePresetId,
  RulePresetOverride,
  Space,
  SpaceId,
  Token,
  TokenId
} from '@labyrinth/schema';

export type LoadProjectCommand = {
  type: 'LoadProject';
  payload: {
    project: ProjectGraph;
  };
};

export type CreateSpaceCommand = {
  type: 'CreateSpace';
  payload: {
    space: Space;
    setAsStart?: boolean;
    addToTargets?: boolean;
  };
};

export type UpdateSpaceCommand = {
  type: 'UpdateSpace';
  payload: {
    id: SpaceId;
    patch: Partial<Pick<Space, 'name' | 'description' | 'tags'>>;
  };
};

export type ConnectSpacesCommand = {
  type: 'ConnectSpaces';
  payload: {
    connection: Connection;
  };
};

export type UpdateConnectionCommand = {
  type: 'UpdateConnection';
  payload: {
    id: ConnectionId;
    patch: Partial<Pick<Connection, 'directed' | 'gateId' | 'description'>>;
  };
};

export type CreateGateCommand = {
  type: 'CreateGate';
  payload: {
    gate: Gate;
  };
};

export type UpdateGateCommand = {
  type: 'UpdateGate';
  payload: {
    id: GateId;
    patch: Partial<Pick<Gate, 'name' | 'kind' | 'requiredTokenIds' | 'description'>>;
  };
};

export type CreateTokenCommand = {
  type: 'CreateToken';
  payload: {
    token: Token;
  };
};

export type UpdateTokenCommand = {
  type: 'UpdateToken';
  payload: {
    id: TokenId;
    patch: Partial<Pick<Token, 'name' | 'kind' | 'locationSpaceId' | 'description'>>;
  };
};

export type MoveTokenCommand = {
  type: 'MoveToken';
  payload: {
    id: TokenId;
    locationSpaceId?: SpaceId;
  };
};

export type CreatePuzzleCommand = {
  type: 'CreatePuzzle';
  payload: {
    puzzle: Puzzle;
  };
};

export type UpdatePuzzleCommand = {
  type: 'UpdatePuzzle';
  payload: {
    id: PuzzleId;
    patch: Partial<
      Pick<
        Puzzle,
        'name' | 'locationSpaceId' | 'requiredTokenIds' | 'outputTokenIds' | 'description'
      >
    >;
  };
};

export type UpdateBeatCommand = {
  type: 'UpdateBeat';
  payload: {
    beat: Beat;
  };
};

export type ReorderBeatCommand = {
  type: 'ReorderBeat';
  payload: {
    id: string;
    order: number;
  };
};

export type SetRulePresetCommand = {
  type: 'SetRulePreset';
  payload: {
    rulePresetId: RulePresetId;
  };
};

export type UpdateRuleOverrideCommand = {
  type: 'UpdateRuleOverride';
  payload: {
    override: RulePresetOverride;
  };
};

export type RemoveRuleOverrideCommand = {
  type: 'RemoveRuleOverride';
  payload: {
    ruleId: string;
  };
};

export type AddDiagnosticExceptionCommand = {
  type: 'AddDiagnosticException';
  payload: {
    exception: DiagnosticException;
  };
};

export type RemoveDiagnosticExceptionCommand = {
  type: 'RemoveDiagnosticException';
  payload: {
    id: string;
  };
};

export type AddReviewThreadCommand = {
  type: 'AddReviewThread';
  payload: {
    thread: ReviewThread;
  };
};

export type UpdateReviewThreadStatusCommand = {
  type: 'UpdateReviewThreadStatus';
  payload: {
    id: string;
    status: ReviewThreadStatus;
  };
};

export type AddReviewCommentCommand = {
  type: 'AddReviewComment';
  payload: {
    threadId: string;
    comment: ReviewComment;
  };
};

export type RemoveReviewCommentCommand = {
  type: 'RemoveReviewComment';
  payload: {
    threadId: string;
    commentId: string;
  };
};

export type Command =
  | LoadProjectCommand
  | CreateSpaceCommand
  | UpdateSpaceCommand
  | ConnectSpacesCommand
  | UpdateConnectionCommand
  | CreateGateCommand
  | UpdateGateCommand
  | CreateTokenCommand
  | UpdateTokenCommand
  | MoveTokenCommand
  | CreatePuzzleCommand
  | UpdatePuzzleCommand
  | UpdateBeatCommand
  | ReorderBeatCommand
  | SetRulePresetCommand
  | UpdateRuleOverrideCommand
  | RemoveRuleOverrideCommand
  | AddDiagnosticExceptionCommand
  | RemoveDiagnosticExceptionCommand
  | AddReviewThreadCommand
  | UpdateReviewThreadStatusCommand
  | AddReviewCommentCommand
  | RemoveReviewCommentCommand;

export type CommandResult = {
  project: ProjectGraph;
};
