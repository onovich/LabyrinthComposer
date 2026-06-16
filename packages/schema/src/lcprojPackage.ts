import type { ProjectGraph } from './project.js';
import type { AssetRef } from './assets.js';

export const LCPROJ_PACKAGE_VERSION = '0.1.0';
export const LCPROJ_PACKAGE_EXTENSION = '.lcproj';
export const LCPROJ_CANONICAL_PROJECT_FILE = 'project.json';

export type LcprojPackageDirectory = 'exports' | 'reports' | 'assets' | 'cache';

export type LcprojPackageArtifactKind =
  | 'engineExport'
  | 'markdownReport'
  | 'jsonReport'
  | 'assetReadme'
  | 'layoutCache';

export type LcprojPackageArtifact = {
  kind: LcprojPackageArtifactKind;
  path: string[];
  canonical: boolean;
};

export type LcprojPackageManifest = {
  packageVersion: typeof LCPROJ_PACKAGE_VERSION;
  projectId: string;
  projectName: string;
  canonicalProjectFile: typeof LCPROJ_CANONICAL_PROJECT_FILE;
  directories: LcprojPackageDirectory[];
  artifacts: LcprojPackageArtifact[];
  assetRefs: AssetRef[];
  migrationRisks: string[];
};

export const LCPROJ_PACKAGE_DIRECTORIES: LcprojPackageDirectory[] = [
  'exports',
  'reports',
  'assets',
  'cache'
];

export const LCPROJ_PACKAGE_ARTIFACTS: Record<LcprojPackageArtifactKind, LcprojPackageArtifact> = {
  engineExport: {
    kind: 'engineExport',
    path: ['exports', 'engine-export.json'],
    canonical: false
  },
  markdownReport: {
    kind: 'markdownReport',
    path: ['exports', 'report.md'],
    canonical: false
  },
  jsonReport: {
    kind: 'jsonReport',
    path: ['reports', 'latest-report.json'],
    canonical: false
  },
  assetReadme: {
    kind: 'assetReadme',
    path: ['assets', 'README.md'],
    canonical: false
  },
  layoutCache: {
    kind: 'layoutCache',
    path: ['cache', 'layout-cache.json'],
    canonical: false
  }
};

export function isLcprojPackagePath(path: string): boolean {
  const normalized = path.replace(/[\\/]+$/, '').toLowerCase();

  return normalized.endsWith(LCPROJ_PACKAGE_EXTENSION);
}

export function createLcprojPackageManifest(project: ProjectGraph): LcprojPackageManifest {
  return {
    packageVersion: LCPROJ_PACKAGE_VERSION,
    projectId: project.project.id,
    projectName: project.project.name,
    canonicalProjectFile: LCPROJ_CANONICAL_PROJECT_FILE,
    directories: [...LCPROJ_PACKAGE_DIRECTORIES],
    artifacts: Object.values(LCPROJ_PACKAGE_ARTIFACTS).map((artifact) => ({
      ...artifact,
      path: [...artifact.path]
    })),
    assetRefs: (project.assets ?? []).map((asset) => ({
      ...asset
    })),
    migrationRisks: [
      'Only project.json is canonical project data.',
      'exports, reports, and cache entries are regenerable artifacts.',
      'assets are package files referenced by project.json AssetRef entries, not embedded content.',
      'package manifests may inventory assetRefs but must not override project.json.',
      'Opening a package must ignore generated artifacts for validation.'
    ]
  };
}
