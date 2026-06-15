import { SCHEMA_VERSION, type SchemaVersion } from '../schemaVersion.js';

export type MigrationResult =
  | {
      ok: true;
      schemaVersion: SchemaVersion;
      value: unknown;
    }
  | {
      ok: false;
      message: string;
    };

export function migrateProjectToCurrent(value: unknown): MigrationResult {
  if (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === SCHEMA_VERSION
  ) {
    return {
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      value
    };
  }

  return {
    ok: false,
    message: `No migration path is registered for schemaVersion other than ${SCHEMA_VERSION}.`
  };
}
