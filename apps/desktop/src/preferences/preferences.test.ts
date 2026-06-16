import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, type ProjectGraph } from '@labyrinth/schema';
import { serializeProject } from '@labyrinth/workbench';

import {
  addRecentProjectPreference,
  createDefaultDesktopPreferences,
  MAX_RECENT_PROJECTS,
  normalizeDesktopPreferences,
  parseDesktopPreferencesText,
  serializeDesktopPreferences
} from './preferences.js';

function projectFixture(): ProjectGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      id: 'preferences-boundary',
      name: 'Preferences Boundary'
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
    beats: {}
  };
}

describe('desktop preferences', () => {
  it('restores defaults for corrupted JSON without throwing', () => {
    const result = parseDesktopPreferencesText('{not-json');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('corrupted preferences should not parse');
    }

    expect(result.preferences).toEqual(createDefaultDesktopPreferences());
    expect(result.message).toContain('defaults were restored');
  });

  it('normalizes recent project paths and window preferences', () => {
    const result = normalizeDesktopPreferences({
      version: 1,
      recentProjects: [
        {
          path: 'D:\\Projects\\Clinic.lcproj',
          lastOpenedAt: '2026-06-16T00:00:00.000Z'
        },
        {
          path: 'd:\\projects\\clinic.lcproj',
          label: 'Duplicate',
          lastOpenedAt: '2026-06-15T00:00:00.000Z'
        }
      ],
      lastDirectory: 'D:\\Projects',
      window: {
        width: 1440,
        height: 900,
        maximized: true
      },
      theme: 'dark',
      telemetryOptIn: true
    });

    expect(result.ok).toBe(true);
    expect(result.preferences.recentProjects).toEqual([
      {
        path: 'D:\\Projects\\Clinic.lcproj',
        label: 'Clinic.lcproj',
        lastOpenedAt: '2026-06-16T00:00:00.000Z'
      }
    ]);
    expect(result.preferences.window).toEqual({
      width: 1440,
      height: 900,
      maximized: true
    });
    expect(result.preferences.theme).toBe('dark');
    expect(result.preferences.telemetryOptIn).toBe(true);
  });

  it('adds recent projects without exceeding the app-local retention limit', () => {
    let preferences = createDefaultDesktopPreferences();

    for (let index = 0; index < MAX_RECENT_PROJECTS + 2; index += 1) {
      preferences = addRecentProjectPreference(
        preferences,
        `D:\\Projects\\Project-${index}.lcproj`,
        `2026-06-16T00:00:${String(index).padStart(2, '0')}.000Z`
      );
    }

    expect(preferences.recentProjects).toHaveLength(MAX_RECENT_PROJECTS);
    expect(preferences.recentProjects[0]?.path).toBe('D:\\Projects\\Project-9.lcproj');
    expect(preferences.lastDirectory).toBe('D:\\Projects');
  });

  it('keeps recent files outside serialized ProjectGraph data', () => {
    const preferences = addRecentProjectPreference(
      createDefaultDesktopPreferences(),
      'D:\\Projects\\Clinic.lcproj',
      '2026-06-16T00:00:00.000Z'
    );
    const serializedProject = serializeProject(projectFixture());
    const serializedPreferences = serializeDesktopPreferences(preferences);

    expect(serializedPreferences).toContain('recentProjects');
    expect(serializedProject).not.toContain('recentProjects');
    expect(serializedProject).not.toContain('D:\\Projects\\Clinic.lcproj');
  });
});
