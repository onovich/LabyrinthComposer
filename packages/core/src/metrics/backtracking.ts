import type { Diagnostic, ProjectGraph } from '@labyrinth/schema';

import { analyzeBacktracking } from '../analysis/backtracking.js';
import { createRuleContext } from '../validation/ruleContext.js';

export function validateBacktracking(project: ProjectGraph): Diagnostic[] {
  return analyzeBacktracking(project, createRuleContext());
}
