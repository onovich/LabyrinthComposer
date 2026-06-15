import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { validateProjectWithRules } from '@labyrinth/core';
import { getRulePreset } from '@labyrinth/rulesets';
import { parseProjectGraph, type Diagnostic, type RulePresetId } from '@labyrinth/schema';

type ExpectedDiagnostic = {
  id: string;
  ruleId: string;
  severity: string;
  suppressed?: boolean;
  exceptionId?: string;
  affectedEntities: Array<{
    kind: string;
    id: string;
  }>;
};

type ExpectedRulesetFixture = {
  presetId: RulePresetId;
  ok: boolean;
  reachableSpaces: string[];
  acquiredTokens: string[];
  openedGates: string[];
  solvedPuzzles: string[];
  diagnostics: ExpectedDiagnostic[];
  timeline: Array<{
    id: string;
    kind?: string;
    intensity?: number;
    order?: number;
  }>;
};

const fixtureRoot = join(process.cwd(), 'packages/test-fixtures/rulesets');

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function collectProjectFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectProjectFiles(path);
    }

    return entry.name.endsWith('.lcproj.json') ? [path] : [];
  });
}

function sortAffectedEntities(affectedEntities: ExpectedDiagnostic['affectedEntities']) {
  return [...affectedEntities].sort((left, right) =>
    `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`)
  );
}

function summarizeDiagnostics(diagnostics: Diagnostic[]): ExpectedDiagnostic[] {
  return diagnostics
    .map((diagnostic) => ({
      id: diagnostic.id,
      ruleId: diagnostic.ruleId,
      severity: diagnostic.severity,
      suppressed: diagnostic.suppressed,
      exceptionId: diagnostic.exceptionId,
      affectedEntities: sortAffectedEntities(diagnostic.affectedEntities)
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function summarizeTimeline(value: unknown): ExpectedRulesetFixture['timeline'] {
  const parsed = parseProjectGraph(value);

  if (!parsed.ok) {
    throw new Error(`Timeline fixture failed schema parse: ${JSON.stringify(parsed.issues)}`);
  }

  return Object.values(parsed.project.beats)
    .map((beat) => ({
      id: beat.id,
      kind: beat.kind,
      intensity: beat.intensity,
      order: beat.order
    }))
    .sort(
      (left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id)
    );
}

describe('ruleset fixtures', () => {
  it('keeps ten exact fixture cases for each phase 2 preset', () => {
    const projectFiles = collectProjectFiles(fixtureRoot);
    const counts = new Map<string, number>();

    for (const projectFile of projectFiles) {
      const expected = readJson(
        projectFile.replace(/\.lcproj\.json$/, '.expected.json')
      ) as ExpectedRulesetFixture;

      counts.set(expected.presetId, (counts.get(expected.presetId) ?? 0) + 1);
    }

    expect(projectFiles.length).toBe(30);
    expect(Object.fromEntries([...counts.entries()].sort())).toEqual({
      'horror.clinic': 10,
      'maze.standard': 10,
      'zelda.mini-dungeon': 10
    });
  });

  it('matches expected diagnostics and traversal summaries by preset', () => {
    const projectFiles = collectProjectFiles(fixtureRoot);

    for (const projectFile of projectFiles) {
      const projectValue = readJson(projectFile);
      const parsed = parseProjectGraph(projectValue);
      const expected = readJson(
        projectFile.replace(/\.lcproj\.json$/, '.expected.json')
      ) as ExpectedRulesetFixture;

      if (!parsed.ok) {
        throw new Error(`${projectFile} failed schema parse: ${JSON.stringify(parsed.issues)}`);
      }

      const result = validateProjectWithRules(parsed.project, {
        preset: getRulePreset(expected.presetId)
      });

      expect(result.ok, projectFile).toBe(expected.ok);
      expect(result.reachableSpaces, projectFile).toEqual(expected.reachableSpaces);
      expect(result.acquiredTokens, projectFile).toEqual(expected.acquiredTokens);
      expect(result.openedGates, projectFile).toEqual(expected.openedGates);
      expect(result.solvedPuzzles, projectFile).toEqual(expected.solvedPuzzles);
      expect(summarizeDiagnostics(result.diagnostics), projectFile).toEqual(expected.diagnostics);
      expect(summarizeTimeline(projectValue), projectFile).toEqual(expected.timeline);
    }
  });
});
