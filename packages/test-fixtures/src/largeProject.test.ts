import { describe, expect, it } from 'vitest';

import { parseProjectGraph } from '@labyrinth/schema';

import { createLargeLinearProject } from './largeProject.js';

describe('large project fixtures', () => {
  it('creates a 50-100 node project for performance smoke coverage', () => {
    const project = createLargeLinearProject();
    const parsed = parseProjectGraph(project);

    expect(Object.keys(project.spaces)).toHaveLength(80);
    expect(Object.keys(project.connections)).toHaveLength(79);
    expect(Object.keys(project.beats)).toHaveLength(80);
    expect(parsed.ok).toBe(true);
  });
});
