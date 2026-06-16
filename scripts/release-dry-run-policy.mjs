export function sanitizeArtifactSegment(value) {
  return String(value)
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function platformLabel(platform) {
  if (platform === 'win32') {
    return 'windows';
  }

  if (platform === 'darwin') {
    return 'macos';
  }

  return sanitizeArtifactSegment(platform || 'unknown');
}

export function createArtifactBaseName({ productName, version, platform, arch, commit }) {
  const segments = [
    sanitizeArtifactSegment(productName),
    sanitizeArtifactSegment(version),
    platformLabel(platform),
    sanitizeArtifactSegment(arch),
    sanitizeArtifactSegment(commit)
  ].filter((segment) => segment.length > 0);

  return segments.join('-');
}

export function createReleaseDryRunManifest({
  productName,
  version,
  platform,
  arch,
  commit,
  desktopDist,
  frontendDist,
  assetCount,
  generatedAt
}) {
  return {
    schemaVersion: 1,
    dryRun: true,
    publish: {
      enabled: false,
      reason: 'Phase 4 productization gate verifies artifacts only and does not publish.'
    },
    signing: {
      enabled: false,
      reason: 'Signing is an explicit future release-stage action.'
    },
    artifact: {
      baseName: createArtifactBaseName({
        productName,
        version,
        platform,
        arch,
        commit
      }),
      productName,
      version,
      platform: platformLabel(platform),
      arch,
      commit
    },
    desktop: {
      dist: desktopDist,
      frontendDist,
      assetCount
    },
    generatedAt
  };
}
