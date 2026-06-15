import type { ValidationResult } from '@labyrinth/schema';

export function formatJson(result: ValidationResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}
