export const DESKTOP_PREFERENCES_VERSION = 1;
export const MAX_RECENT_PROJECTS = 8;

export type ThemePreference = 'system' | 'light' | 'dark';

export type RecentProjectPreference = {
  path: string;
  label: string;
  lastOpenedAt: string;
};

export type WindowPreference = {
  width: number;
  height: number;
  maximized: boolean;
};

export type DesktopPreferences = {
  version: typeof DESKTOP_PREFERENCES_VERSION;
  recentProjects: RecentProjectPreference[];
  lastDirectory?: string;
  window: WindowPreference;
  theme: ThemePreference;
  telemetryOptIn: boolean;
};

export type PreferencesParseResult =
  | {
      ok: true;
      preferences: DesktopPreferences;
    }
  | {
      ok: false;
      preferences: DesktopPreferences;
      message: string;
    };

const DEFAULT_WINDOW_PREFERENCE: WindowPreference = {
  width: 1280,
  height: 800,
  maximized: false
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function projectLabelFromPath(path: string): string {
  const normalized = path.replace(/[\\/]+$/, '');
  const segments = normalized.split(/[\\/]/);
  const label = segments.at(-1)?.trim();

  return label === undefined || label.length === 0 ? path : label;
}

function directoryFromPath(path: string): string | undefined {
  const trimmed = path.replace(/[\\/]+$/, '');
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));

  return index > 0 ? trimmed.slice(0, index) : undefined;
}

function normalizeRecentProject(value: unknown): RecentProjectPreference | undefined {
  if (!isRecord(value) || typeof value.path !== 'string' || value.path.trim().length === 0) {
    return undefined;
  }

  const path = value.path.trim();

  return {
    path,
    label:
      typeof value.label === 'string' && value.label.trim().length > 0
        ? value.label.trim()
        : projectLabelFromPath(path),
    lastOpenedAt:
      typeof value.lastOpenedAt === 'string' && value.lastOpenedAt.trim().length > 0
        ? value.lastOpenedAt.trim()
        : '1970-01-01T00:00:00.000Z'
  };
}

function normalizeWindowPreference(value: unknown): WindowPreference {
  if (!isRecord(value)) {
    return { ...DEFAULT_WINDOW_PREFERENCE };
  }

  return {
    width:
      typeof value.width === 'number' && Number.isFinite(value.width) && value.width >= 640
        ? value.width
        : DEFAULT_WINDOW_PREFERENCE.width,
    height:
      typeof value.height === 'number' && Number.isFinite(value.height) && value.height >= 480
        ? value.height
        : DEFAULT_WINDOW_PREFERENCE.height,
    maximized: typeof value.maximized === 'boolean' ? value.maximized : false
  };
}

function normalizeThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function createDefaultDesktopPreferences(): DesktopPreferences {
  return {
    version: DESKTOP_PREFERENCES_VERSION,
    recentProjects: [],
    window: { ...DEFAULT_WINDOW_PREFERENCE },
    theme: 'system',
    telemetryOptIn: false
  };
}

export function normalizeDesktopPreferences(value: unknown): PreferencesParseResult {
  const defaults = createDefaultDesktopPreferences();

  if (!isRecord(value) || value.version !== DESKTOP_PREFERENCES_VERSION) {
    return {
      ok: false,
      preferences: defaults,
      message: 'Preferences were missing or used an unsupported version; defaults were restored.'
    };
  }

  const seenPaths = new Set<string>();
  const recentProjects = (Array.isArray(value.recentProjects) ? value.recentProjects : [])
    .map((item) => normalizeRecentProject(item))
    .filter((item): item is RecentProjectPreference => item !== undefined)
    .filter((item) => {
      const key = item.path.toLowerCase();

      if (seenPaths.has(key)) {
        return false;
      }

      seenPaths.add(key);
      return true;
    })
    .slice(0, MAX_RECENT_PROJECTS);

  return {
    ok: true,
    preferences: {
      version: DESKTOP_PREFERENCES_VERSION,
      recentProjects,
      lastDirectory:
        typeof value.lastDirectory === 'string' && value.lastDirectory.trim().length > 0
          ? value.lastDirectory.trim()
          : undefined,
      window: normalizeWindowPreference(value.window),
      theme: normalizeThemePreference(value.theme),
      telemetryOptIn:
        typeof value.telemetryOptIn === 'boolean' ? value.telemetryOptIn : defaults.telemetryOptIn
    }
  };
}

export function parseDesktopPreferencesText(
  text: string | undefined | null
): PreferencesParseResult {
  if (text === undefined || text === null || text.trim().length === 0) {
    return {
      ok: true,
      preferences: createDefaultDesktopPreferences()
    };
  }

  try {
    return normalizeDesktopPreferences(JSON.parse(text) as unknown);
  } catch (error) {
    return {
      ok: false,
      preferences: createDefaultDesktopPreferences(),
      message: `Preferences were unreadable and defaults were restored: ${String(error)}`
    };
  }
}

export function serializeDesktopPreferences(preferences: DesktopPreferences): string {
  return `${JSON.stringify(preferences, null, 2)}\n`;
}

export function addRecentProjectPreference(
  preferences: DesktopPreferences,
  path: string,
  openedAt = new Date().toISOString()
): DesktopPreferences {
  const trimmedPath = path.trim();

  if (trimmedPath.length === 0) {
    return {
      ...preferences,
      recentProjects: preferences.recentProjects.map((project) => ({ ...project })),
      window: { ...preferences.window }
    };
  }

  const pathKey = trimmedPath.toLowerCase();
  const recentProjects = [
    {
      path: trimmedPath,
      label: projectLabelFromPath(trimmedPath),
      lastOpenedAt: openedAt
    },
    ...preferences.recentProjects.filter((project) => project.path.toLowerCase() !== pathKey)
  ].slice(0, MAX_RECENT_PROJECTS);
  const lastDirectory = directoryFromPath(trimmedPath) ?? preferences.lastDirectory;

  return {
    ...preferences,
    recentProjects,
    lastDirectory,
    window: { ...preferences.window }
  };
}
