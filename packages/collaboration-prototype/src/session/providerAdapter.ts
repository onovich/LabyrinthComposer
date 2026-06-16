import {
  cloneCollaborationCommandEnvelope,
  type CollaborationCommandEnvelope
} from './commandEnvelope.js';

export type CollaborationEnvelopeListener = (envelope: CollaborationCommandEnvelope) => void;

export type CollaborationProviderAdapter = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(envelope: CollaborationCommandEnvelope): Promise<void>;
  subscribe(listener: CollaborationEnvelopeListener): () => void;
};

export type InMemoryCollaborationProviderAdapter = CollaborationProviderAdapter & {
  isConnected(): boolean;
};

export function createInMemoryCollaborationProviderAdapter(): InMemoryCollaborationProviderAdapter {
  let connected = false;
  const listeners = new Set<CollaborationEnvelopeListener>();

  return {
    async connect() {
      connected = true;
    },
    async disconnect() {
      connected = false;
    },
    async publish(envelope) {
      if (!connected) {
        throw new Error('Collaboration provider is not connected.');
      }

      for (const listener of listeners) {
        listener(cloneCollaborationCommandEnvelope(envelope));
      }
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    isConnected() {
      return connected;
    }
  };
}
