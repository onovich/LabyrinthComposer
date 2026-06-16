import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION } from '../schemaVersion.js';
import { migrateProjectToCurrent } from './index.js';

describe('project migrations', () => {
  it('accepts the current schema version without changing the value', () => {
    const value = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'current',
        name: 'Current'
      }
    };

    const result = migrateProjectToCurrent(value);

    expect(result).toEqual({
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      value
    });
  });

  it('accepts current schema values with AssetRef entries without rewriting them', () => {
    const value = {
      schemaVersion: SCHEMA_VERSION,
      project: {
        id: 'current-with-assets',
        name: 'Current With Assets'
      },
      startSpaceId: 'start',
      targetSpaceIds: ['start'],
      spaces: {
        start: {
          id: 'start',
          name: 'Start'
        }
      },
      connections: {},
      gates: {},
      tokens: {},
      puzzles: {},
      beats: {},
      assets: [
        {
          id: 'map-sketch',
          kind: 'image',
          packagePath: 'assets/map-sketch.png'
        }
      ]
    };

    const result = migrateProjectToCurrent(value);

    expect(result).toEqual({
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      value
    });
  });

  it('rejects unregistered schema versions instead of inventing a migration', () => {
    expect(
      migrateProjectToCurrent({
        schemaVersion: '0.0.0'
      })
    ).toEqual({
      ok: false,
      message: `No migration path is registered for schemaVersion other than ${SCHEMA_VERSION}.`
    });
  });
});
