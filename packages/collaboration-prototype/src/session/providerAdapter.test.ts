import { describe, expect, it } from 'vitest';

import {
  createInMemoryCollaborationProviderAdapter,
  type CollaborationProviderAdapter
} from './providerAdapter.js';
import type { CollaborationCommandEnvelope } from './commandEnvelope.js';

function envelopeFixture(): CollaborationCommandEnvelope {
  return {
    id: 'command-1',
    actorId: 'designer-a',
    command: {
      type: 'CreateSpace',
      payload: {
        space: {
          id: 'exit',
          name: 'Exit'
        }
      }
    }
  };
}

describe('collaboration provider adapter', () => {
  it('starts disconnected and rejects publish until explicitly connected', async () => {
    const provider = createInMemoryCollaborationProviderAdapter();

    expect(provider.isConnected()).toBe(false);
    await expect(provider.publish(envelopeFixture())).rejects.toThrow(
      'Collaboration provider is not connected.'
    );
  });

  it('publishes command envelopes without owning ProjectGraph state', async () => {
    const provider: CollaborationProviderAdapter = createInMemoryCollaborationProviderAdapter();
    const received: CollaborationCommandEnvelope[] = [];

    provider.subscribe((envelope) => {
      received.push(envelope);
    });
    await provider.connect();
    await provider.publish(envelopeFixture());

    expect(received).toEqual([envelopeFixture()]);
  });

  it('stops delivery after unsubscribe', async () => {
    const provider = createInMemoryCollaborationProviderAdapter();
    const received: CollaborationCommandEnvelope[] = [];
    const unsubscribe = provider.subscribe((envelope) => {
      received.push(envelope);
    });

    await provider.connect();
    unsubscribe();
    await provider.publish(envelopeFixture());

    expect(received).toEqual([]);
  });

  it('clones published envelopes before delivery', async () => {
    const provider = createInMemoryCollaborationProviderAdapter();
    const envelope = envelopeFixture();

    provider.subscribe((received) => {
      if (received.command.type !== 'CreateSpace') {
        throw new Error('Unexpected command type.');
      }

      received.command.payload.space.name = 'Mutated In Listener';
    });
    await provider.connect();
    await provider.publish(envelope);

    expect(envelope).toEqual(envelopeFixture());
  });

  it('disconnects without storing provider state in an envelope', async () => {
    const provider = createInMemoryCollaborationProviderAdapter();

    await provider.connect();
    await provider.disconnect();

    expect(provider.isConnected()).toBe(false);
    expect(JSON.stringify(envelopeFixture())).not.toContain('connection');
  });
});
