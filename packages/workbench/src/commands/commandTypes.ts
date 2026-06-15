import type { Connection, ConnectionId, ProjectGraph, Space, SpaceId } from '@labyrinth/schema';

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

export type Command =
  | LoadProjectCommand
  | CreateSpaceCommand
  | UpdateSpaceCommand
  | ConnectSpacesCommand
  | UpdateConnectionCommand;

export type CommandResult = {
  project: ProjectGraph;
};
