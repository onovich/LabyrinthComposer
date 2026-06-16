import { describe, expect, it } from 'vitest';

import { createEmptyProject } from './project.js';
import {
  createLcprojPackageManifest,
  isLcprojPackagePath,
  LCPROJ_CANONICAL_PROJECT_FILE,
  LCPROJ_PACKAGE_ARTIFACTS
} from './lcprojPackage.js';

describe('lcproj package contract', () => {
  it('recognizes package directory paths without accepting JSON project files', () => {
    expect(isLcprojPackagePath('MyProject.lcproj')).toBe(true);
    expect(isLcprojPackagePath('C:\\Projects\\MyProject.lcproj\\')).toBe(true);
    expect(isLcprojPackagePath('MyProject.lcproj.json')).toBe(false);
  });

  it('documents project.json as the only canonical package file', () => {
    const project = createEmptyProject('package-test');
    const manifest = createLcprojPackageManifest({
      ...project,
      project: {
        id: 'package-test',
        name: 'Package Test'
      }
    });

    expect(manifest.canonicalProjectFile).toBe(LCPROJ_CANONICAL_PROJECT_FILE);
    expect(manifest.artifacts).toContainEqual(LCPROJ_PACKAGE_ARTIFACTS.engineExport);
    expect(manifest.artifacts.every((artifact) => artifact.canonical)).toBe(false);
    expect(manifest.migrationRisks.join(' ')).toContain('project.json is canonical');
  });
});
