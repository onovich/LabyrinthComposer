import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const rootDir = process.cwd();
const samplePath = join(rootDir, 'examples/engine-export/sample-engine-export.json');
const unityImporterPath = join(rootDir, 'examples/unity-importer/LabyrinthEngineImporter.cs');
const godotImporterPath = join(rootDir, 'examples/godot-importer/labyrinth_engine_importer.gd');

type ImporterSample = {
  spaces: Array<{ id: string; name: string }>;
  gates: Array<{ id: string; requiredTokenIds: string[] }>;
  tokens: Array<{ id: string; locationSpaceId?: string }>;
};

function readSample(): ImporterSample {
  return JSON.parse(readFileSync(samplePath, 'utf8')) as ImporterSample;
}

describe('engine importer examples', () => {
  it('lets importer examples locate Space, Gate, and Token entities by stable IDs', () => {
    const sample = readSample();

    expect(sample.spaces.find((space) => space.id === 'entry')?.name).toBe('Entry Hall');
    expect(sample.gates.find((gate) => gate.id === 'brass-key-gate')?.requiredTokenIds).toEqual([
      'brass-key'
    ]);
    expect(sample.tokens.find((token) => token.id === 'brass-key')?.locationSpaceId).toBe(
      'key-room'
    );
  });

  it('keeps engine examples as read-only consumers of export JSON', () => {
    const unityImporter = readFileSync(unityImporterPath, 'utf8');
    const godotImporter = readFileSync(godotImporterPath, 'utf8');
    const workspaceScope = `@${'labyrinth/'}`;

    expect(unityImporter).toContain('FromJson');
    expect(godotImporter).toContain('load_from_text');
    expect(unityImporter).not.toContain(workspaceScope);
    expect(godotImporter).not.toContain(workspaceScope);
    expect(unityImporter).not.toContain('write');
    expect(godotImporter).not.toContain('store_');
  });
});
