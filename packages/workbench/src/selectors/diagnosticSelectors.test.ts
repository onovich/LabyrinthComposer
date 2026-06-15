import { describe, expect, it } from 'vitest';

import type { Diagnostic, ValidationResult } from '@labyrinth/schema';

import {
  createDiagnosticViewModels,
  createHighlightedEntitiesForDiagnostic,
  createValidationSummary,
  entityRefKey
} from './diagnosticSelectors.js';

const warningDiagnostic: Diagnostic = {
  id: 'warning-late',
  ruleId: 'content.warning',
  severity: 'warning',
  message: 'A warning',
  affectedEntities: [{ kind: 'puzzle', id: 'puzzle-a' }],
  causeChain: [],
  suggestions: []
};

const errorDiagnostic: Diagnostic = {
  id: 'error-main',
  ruleId: 'flow.error',
  severity: 'error',
  message: 'An error',
  affectedEntities: [
    { kind: 'space', id: 'locked-room' },
    { kind: 'connection', id: 'start-locked-room' }
  ],
  causeChain: [
    {
      entity: { kind: 'gate', id: 'gate-a' },
      message: 'Gate blocks the route'
    },
    {
      entity: { kind: 'space', id: 'locked-room' },
      message: 'Duplicate entity should be deduped'
    }
  ],
  suggestions: [
    {
      kind: 'move_token',
      message: 'Move the key before the gate',
      targetEntities: [
        { kind: 'token', id: 'key-a' },
        { kind: 'gate', id: 'gate-a' }
      ]
    }
  ]
};

const infoDiagnostic: Diagnostic = {
  id: 'info-note',
  ruleId: 'content.info',
  severity: 'info',
  message: 'An info note',
  affectedEntities: [{ kind: 'beat', id: 'beat-a' }],
  causeChain: [],
  suggestions: []
};

const validation: ValidationResult = {
  ok: false,
  reachableSpaces: ['start'],
  acquiredTokens: ['key-a'],
  openedGates: ['gate-a'],
  solvedPuzzles: ['puzzle-a'],
  diagnostics: [warningDiagnostic, infoDiagnostic, errorDiagnostic],
  trace: []
};

describe('diagnostic selectors', () => {
  it('summarizes validation progress and diagnostic counts', () => {
    expect(createValidationSummary(validation)).toEqual({
      ok: false,
      reachableSpaces: ['start'],
      acquiredTokens: ['key-a'],
      openedGates: ['gate-a'],
      solvedPuzzles: ['puzzle-a'],
      diagnosticCount: 3,
      errorCount: 1,
      warningCount: 1,
      infoCount: 1
    });
  });

  it('sorts diagnostics by severity and rule identity', () => {
    expect(createDiagnosticViewModels(validation).map((diagnostic) => diagnostic.id)).toEqual([
      'error-main',
      'warning-late',
      'info-note'
    ]);
  });

  it('collects unique highlighted entities from affected entities, causes, and suggestions', () => {
    expect(createHighlightedEntitiesForDiagnostic(errorDiagnostic).map(entityRefKey)).toEqual([
      'space:locked-room',
      'connection:start-locked-room',
      'gate:gate-a',
      'token:key-a'
    ]);
  });
});
