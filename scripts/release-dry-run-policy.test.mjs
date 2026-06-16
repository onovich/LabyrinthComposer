import { describe, expect, it } from 'vitest';

import {
  createArtifactBaseName,
  createReleaseDryRunManifest,
  platformLabel,
  sanitizeArtifactSegment
} from './release-dry-run-policy.mjs';

describe('release dry-run artifact policy', () => {
  it('creates portable artifact names from product, platform, and commit data', () => {
    expect(sanitizeArtifactSegment('Labyrinth Composer RC')).toBe('Labyrinth-Composer-RC');
    expect(platformLabel('win32')).toBe('windows');
    expect(
      createArtifactBaseName({
        productName: 'Labyrinth Composer',
        version: '0.1.0',
        platform: 'win32',
        arch: 'x64',
        commit: 'abc123'
      })
    ).toBe('Labyrinth-Composer-0.1.0-windows-x64-abc123');
  });

  it('keeps publish and signing disabled in dry-run manifests', () => {
    const manifest = createReleaseDryRunManifest({
      productName: 'Labyrinth Composer',
      version: '0.1.0',
      platform: 'linux',
      arch: 'x64',
      commit: 'abc123',
      desktopDist: 'apps/desktop/dist',
      frontendDist: 'apps/desktop/dist',
      assetCount: 7,
      generatedAt: '2026-06-16T00:00:00.000Z'
    });

    expect(manifest.dryRun).toBe(true);
    expect(manifest.publish.enabled).toBe(false);
    expect(manifest.publish.reason).toBe(
      'Phase 4 productization gate verifies artifacts only and does not publish.'
    );
    expect(manifest.signing.enabled).toBe(false);
    expect(manifest.artifact.baseName).toBe('Labyrinth-Composer-0.1.0-linux-x64-abc123');
    expect(manifest.desktop).toEqual({
      assetCount: 7,
      dist: 'apps/desktop/dist',
      frontendDist: 'apps/desktop/dist'
    });
  });
});
