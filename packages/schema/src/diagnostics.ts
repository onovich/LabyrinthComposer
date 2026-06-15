import type { EntityRef } from './entities.js';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export type CauseStep = {
  entity: EntityRef;
  message: string;
};

export type FixSuggestion = {
  kind: 'move_token' | 'add_connection' | 'remove_requirement' | 'add_hint' | 'mark_exception';
  message: string;
  targetEntities: EntityRef[];
};

export type Diagnostic = {
  id: string;
  ruleId: string;
  severity: DiagnosticSeverity;
  message: string;
  affectedEntities: EntityRef[];
  causeChain: CauseStep[];
  suggestions: FixSuggestion[];
};

export type ValidationTraceEventKind =
  | 'space_reached'
  | 'token_acquired'
  | 'gate_opened'
  | 'puzzle_solved';

export type ValidationTraceEvent = {
  kind: ValidationTraceEventKind;
  entity: EntityRef;
  message: string;
};

export type ValidationTraceStep = {
  iteration: number;
  events: ValidationTraceEvent[];
};

export type ValidationResult = {
  ok: boolean;
  reachableSpaces: string[];
  acquiredTokens: string[];
  openedGates: string[];
  solvedPuzzles: string[];
  diagnostics: Diagnostic[];
  trace: ValidationTraceStep[];
};
