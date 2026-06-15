export type SpaceId = string;
export type ConnectionId = string;
export type GateId = string;
export type TokenId = string;
export type PuzzleId = string;
export type BeatId = string;
export type RulePresetId = string;

export type EntityKind = 'space' | 'connection' | 'gate' | 'token' | 'puzzle' | 'beat';

export type EntityRef = {
  kind: EntityKind;
  id: string;
};

export type Space = {
  id: SpaceId;
  name: string;
  description?: string;
  tags?: string[];
};

export type Connection = {
  id: ConnectionId;
  fromSpaceId: SpaceId;
  toSpaceId: SpaceId;
  directed?: boolean;
  gateId?: GateId;
  description?: string;
};

export type GateKind = 'lock' | 'ability' | 'knowledge' | 'state' | 'resource';

export type Gate = {
  id: GateId;
  name: string;
  kind: GateKind;
  requiredTokenIds: TokenId[];
  description?: string;
};

export type TokenKind = 'item' | 'ability' | 'knowledge' | 'state' | 'relationship' | 'resource';

export type Token = {
  id: TokenId;
  name: string;
  kind: TokenKind;
  locationSpaceId?: SpaceId;
  description?: string;
};

export type Puzzle = {
  id: PuzzleId;
  name: string;
  locationSpaceId: SpaceId;
  requiredTokenIds: TokenId[];
  outputTokenIds: TokenId[];
  description?: string;
};

export type BeatKind = 'discovery' | 'threat' | 'relief' | 'puzzle' | 'reward';

export type Beat = {
  id: BeatId;
  name: string;
  spaceId?: SpaceId;
  kind?: BeatKind;
  intensity?: number;
  order?: number;
  description?: string;
};
