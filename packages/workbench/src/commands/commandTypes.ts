import type {
  Beat,
  Connection,
  ConnectionId,
  Gate,
  GateId,
  ProjectGraph,
  Puzzle,
  PuzzleId,
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
  | UpdateBeatCommand;

export type CommandResult = {
  project: ProjectGraph;
};
