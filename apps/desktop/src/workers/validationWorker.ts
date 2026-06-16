import type { ProjectGraph } from '@labyrinth/schema';
import {
  createValidationComposition,
  type ValidationComposition
} from '@labyrinth/workbench';

export type ValidationWorkerRequest = {
  requestId: number;
  project: ProjectGraph;
};

export type ValidationWorkerResponse = {
  requestId: number;
  composition: ValidationComposition;
  elapsedMs: number;
};

self.onmessage = (event: MessageEvent<ValidationWorkerRequest>) => {
  const startedAt = performance.now();
  const composition = createValidationComposition(event.data.project);

  self.postMessage({
    requestId: event.data.requestId,
    composition,
    elapsedMs: performance.now() - startedAt
  } satisfies ValidationWorkerResponse);
};
