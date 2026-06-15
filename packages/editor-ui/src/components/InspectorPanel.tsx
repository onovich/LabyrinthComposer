import { useEffect, useState } from 'react';

import type {
  Beat,
  Connection,
  EntityRef,
  Gate,
  GateKind,
  ProjectGraph,
  Puzzle,
  Space,
  Token,
  TokenKind
} from '@labyrinth/schema';

type InspectorPanelProps = {
  project: ProjectGraph;
  selectedEntity: EntityRef | null;
  onUpdateSpace(id: string, patch: Partial<ProjectGraph['spaces'][string]>): void;
  onUpdateConnection(id: string, patch: Partial<ProjectGraph['connections'][string]>): void;
  onUpdateGate(id: string, patch: Partial<ProjectGraph['gates'][string]>): void;
  onUpdateToken(id: string, patch: Partial<ProjectGraph['tokens'][string]>): void;
  onUpdatePuzzle(id: string, patch: Partial<ProjectGraph['puzzles'][string]>): void;
  onUpdateBeat(id: string, patch: Partial<ProjectGraph['beats'][string]>): void;
};

type DraftTextFieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  onCommit(value: string): void;
};

const gateKinds: GateKind[] = ['lock', 'ability', 'knowledge', 'state', 'resource'];
const tokenKinds: TokenKind[] = [
  'item',
  'ability',
  'knowledge',
  'state',
  'relationship',
  'resource'
];

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function splitTags(value: string): string[] | undefined {
  const tags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return tags.length > 0 ? tags : undefined;
}

function toggleId(ids: string[], id: string, checked: boolean): string[] {
  const next = checked ? [...new Set([...ids, id])] : ids.filter((item) => item !== id);
  return next.sort();
}

function DraftTextField({ label, value, multiline = false, onCommit }: DraftTextFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const control = multiline ? (
    <textarea
      value={draft}
      onBlur={() => onCommit(draft)}
      onChange={(event) => setDraft(event.target.value)}
    />
  ) : (
    <input
      value={draft}
      onBlur={() => onCommit(draft)}
      onChange={(event) => setDraft(event.target.value)}
    />
  );

  return (
    <label className="lc-field">
      <span>{label}</span>
      {control}
    </label>
  );
}

function EntityId({ entity }: { entity: EntityRef }) {
  return <div className="lc-entity-id">{`${entity.kind}:${entity.id}`}</div>;
}

function TokenChecklist({
  tokens,
  selectedIds,
  onChange
}: {
  tokens: Record<string, Token>;
  selectedIds: string[];
  onChange(ids: string[]): void;
}) {
  if (Object.keys(tokens).length === 0) {
    return <p className="lc-panel-copy">No tokens available.</p>;
  }

  return (
    <div className="lc-check-list">
      {sortedEntries(tokens).map(([id, token]) => (
        <label className="lc-check-item" key={id}>
          <input
            checked={selectedIds.includes(id)}
            type="checkbox"
            onChange={(event) => onChange(toggleId(selectedIds, id, event.target.checked))}
          />
          <span>{token.name}</span>
        </label>
      ))}
    </div>
  );
}

function SpaceInspector({
  space,
  onUpdateSpace
}: {
  space: Space;
  onUpdateSpace(id: string, patch: Partial<ProjectGraph['spaces'][string]>): void;
}) {
  return (
    <>
      <DraftTextField
        label="Name"
        value={space.name}
        onCommit={(name) => onUpdateSpace(space.id, { name })}
      />
      <DraftTextField
        label="Description"
        multiline
        value={space.description ?? ''}
        onCommit={(description) =>
          onUpdateSpace(space.id, { description: optionalText(description) })
        }
      />
      <DraftTextField
        label="Tags"
        value={(space.tags ?? []).join(', ')}
        onCommit={(tags) => onUpdateSpace(space.id, { tags: splitTags(tags) })}
      />
      <EntityId entity={{ kind: 'space', id: space.id }} />
    </>
  );
}

function ConnectionInspector({
  connection,
  gates,
  onUpdateConnection
}: {
  connection: Connection;
  gates: Record<string, Gate>;
  onUpdateConnection(id: string, patch: Partial<ProjectGraph['connections'][string]>): void;
}) {
  return (
    <>
      <div className="lc-readonly-field">
        {connection.fromSpaceId}
        {' -> '}
        {connection.toSpaceId}
      </div>
      <label className="lc-check-item">
        <input
          checked={connection.directed === true}
          type="checkbox"
          onChange={(event) =>
            onUpdateConnection(connection.id, { directed: event.target.checked })
          }
        />
        <span>Directed connection</span>
      </label>
      <label className="lc-field">
        <span>Gate</span>
        <select
          value={connection.gateId ?? ''}
          onChange={(event) =>
            onUpdateConnection(connection.id, { gateId: optionalText(event.target.value) })
          }
        >
          <option value="">No gate</option>
          {sortedEntries(gates).map(([id, gate]) => (
            <option key={id} value={id}>
              {gate.name}
            </option>
          ))}
        </select>
      </label>
      <DraftTextField
        label="Description"
        multiline
        value={connection.description ?? ''}
        onCommit={(description) =>
          onUpdateConnection(connection.id, { description: optionalText(description) })
        }
      />
      <EntityId entity={{ kind: 'connection', id: connection.id }} />
    </>
  );
}

function GateInspector({
  gate,
  tokens,
  onUpdateGate
}: {
  gate: Gate;
  tokens: Record<string, Token>;
  onUpdateGate(id: string, patch: Partial<ProjectGraph['gates'][string]>): void;
}) {
  return (
    <>
      <DraftTextField
        label="Name"
        value={gate.name}
        onCommit={(name) => onUpdateGate(gate.id, { name })}
      />
      <label className="lc-field">
        <span>Kind</span>
        <select
          value={gate.kind}
          onChange={(event) => onUpdateGate(gate.id, { kind: event.target.value as GateKind })}
        >
          {gateKinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </label>
      <div className="lc-field">
        <span>Required tokens</span>
        <TokenChecklist
          selectedIds={gate.requiredTokenIds}
          tokens={tokens}
          onChange={(requiredTokenIds) => onUpdateGate(gate.id, { requiredTokenIds })}
        />
      </div>
      <DraftTextField
        label="Description"
        multiline
        value={gate.description ?? ''}
        onCommit={(description) =>
          onUpdateGate(gate.id, { description: optionalText(description) })
        }
      />
      <EntityId entity={{ kind: 'gate', id: gate.id }} />
    </>
  );
}

function TokenInspector({
  token,
  spaces,
  onUpdateToken
}: {
  token: Token;
  spaces: Record<string, Space>;
  onUpdateToken(id: string, patch: Partial<ProjectGraph['tokens'][string]>): void;
}) {
  return (
    <>
      <DraftTextField
        label="Name"
        value={token.name}
        onCommit={(name) => onUpdateToken(token.id, { name })}
      />
      <label className="lc-field">
        <span>Kind</span>
        <select
          value={token.kind}
          onChange={(event) => onUpdateToken(token.id, { kind: event.target.value as TokenKind })}
        >
          {tokenKinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </label>
      <label className="lc-field">
        <span>Location</span>
        <select
          value={token.locationSpaceId ?? ''}
          onChange={(event) =>
            onUpdateToken(token.id, { locationSpaceId: optionalText(event.target.value) })
          }
        >
          <option value="">No fixed location</option>
          {sortedEntries(spaces).map(([id, space]) => (
            <option key={id} value={id}>
              {space.name}
            </option>
          ))}
        </select>
      </label>
      <DraftTextField
        label="Description"
        multiline
        value={token.description ?? ''}
        onCommit={(description) =>
          onUpdateToken(token.id, { description: optionalText(description) })
        }
      />
      <EntityId entity={{ kind: 'token', id: token.id }} />
    </>
  );
}

function PuzzleInspector({
  puzzle,
  spaces,
  tokens,
  onUpdatePuzzle
}: {
  puzzle: Puzzle;
  spaces: Record<string, Space>;
  tokens: Record<string, Token>;
  onUpdatePuzzle(id: string, patch: Partial<ProjectGraph['puzzles'][string]>): void;
}) {
  return (
    <>
      <DraftTextField
        label="Name"
        value={puzzle.name}
        onCommit={(name) => onUpdatePuzzle(puzzle.id, { name })}
      />
      <label className="lc-field">
        <span>Location</span>
        <select
          value={puzzle.locationSpaceId}
          onChange={(event) => onUpdatePuzzle(puzzle.id, { locationSpaceId: event.target.value })}
        >
          {sortedEntries(spaces).map(([id, space]) => (
            <option key={id} value={id}>
              {space.name}
            </option>
          ))}
        </select>
      </label>
      <div className="lc-field">
        <span>Required tokens</span>
        <TokenChecklist
          selectedIds={puzzle.requiredTokenIds}
          tokens={tokens}
          onChange={(requiredTokenIds) => onUpdatePuzzle(puzzle.id, { requiredTokenIds })}
        />
      </div>
      <div className="lc-field">
        <span>Output tokens</span>
        <TokenChecklist
          selectedIds={puzzle.outputTokenIds}
          tokens={tokens}
          onChange={(outputTokenIds) => onUpdatePuzzle(puzzle.id, { outputTokenIds })}
        />
      </div>
      <DraftTextField
        label="Description"
        multiline
        value={puzzle.description ?? ''}
        onCommit={(description) =>
          onUpdatePuzzle(puzzle.id, { description: optionalText(description) })
        }
      />
      <EntityId entity={{ kind: 'puzzle', id: puzzle.id }} />
    </>
  );
}

function BeatInspector({
  beat,
  spaces,
  onUpdateBeat
}: {
  beat: Beat;
  spaces: Record<string, Space>;
  onUpdateBeat(id: string, patch: Partial<ProjectGraph['beats'][string]>): void;
}) {
  return (
    <>
      <DraftTextField
        label="Name"
        value={beat.name}
        onCommit={(name) => onUpdateBeat(beat.id, { name })}
      />
      <label className="lc-field">
        <span>Space</span>
        <select
          value={beat.spaceId ?? ''}
          onChange={(event) => onUpdateBeat(beat.id, { spaceId: optionalText(event.target.value) })}
        >
          <option value="">No assigned space</option>
          {sortedEntries(spaces).map(([id, space]) => (
            <option key={id} value={id}>
              {space.name}
            </option>
          ))}
        </select>
      </label>
      <label className="lc-field">
        <span>Intensity</span>
        <input
          max="1"
          min="0"
          step="0.05"
          type="number"
          value={beat.intensity ?? 0}
          onChange={(event) => onUpdateBeat(beat.id, { intensity: Number(event.target.value) })}
        />
      </label>
      <DraftTextField
        label="Description"
        multiline
        value={beat.description ?? ''}
        onCommit={(description) =>
          onUpdateBeat(beat.id, { description: optionalText(description) })
        }
      />
      <EntityId entity={{ kind: 'beat', id: beat.id }} />
    </>
  );
}

export function InspectorPanel({
  project,
  selectedEntity,
  onUpdateSpace,
  onUpdateConnection,
  onUpdateGate,
  onUpdateToken,
  onUpdatePuzzle,
  onUpdateBeat
}: InspectorPanelProps) {
  if (selectedEntity === null) {
    return (
      <section className="lc-panel-section">
        <div className="lc-section-label">Inspector</div>
        <p className="lc-panel-copy">Select an entity to edit its properties.</p>
      </section>
    );
  }

  const entity =
    selectedEntity.kind === 'space'
      ? project.spaces[selectedEntity.id]
      : selectedEntity.kind === 'connection'
        ? project.connections[selectedEntity.id]
        : selectedEntity.kind === 'gate'
          ? project.gates[selectedEntity.id]
          : selectedEntity.kind === 'token'
            ? project.tokens[selectedEntity.id]
            : selectedEntity.kind === 'puzzle'
              ? project.puzzles[selectedEntity.id]
              : project.beats[selectedEntity.id];

  if (entity === undefined) {
    return (
      <section className="lc-panel-section">
        <div className="lc-section-label">Inspector</div>
        <p className="lc-panel-copy">
          {selectedEntity.kind}:{selectedEntity.id}
        </p>
      </section>
    );
  }

  return (
    <section className="lc-panel-section">
      <div className="lc-section-label">Inspector</div>
      {selectedEntity.kind === 'space' ? (
        <SpaceInspector space={entity as Space} onUpdateSpace={onUpdateSpace} />
      ) : selectedEntity.kind === 'connection' ? (
        <ConnectionInspector
          connection={entity as Connection}
          gates={project.gates}
          onUpdateConnection={onUpdateConnection}
        />
      ) : selectedEntity.kind === 'gate' ? (
        <GateInspector gate={entity as Gate} tokens={project.tokens} onUpdateGate={onUpdateGate} />
      ) : selectedEntity.kind === 'token' ? (
        <TokenInspector
          spaces={project.spaces}
          token={entity as Token}
          onUpdateToken={onUpdateToken}
        />
      ) : selectedEntity.kind === 'puzzle' ? (
        <PuzzleInspector
          puzzle={entity as Puzzle}
          spaces={project.spaces}
          tokens={project.tokens}
          onUpdatePuzzle={onUpdatePuzzle}
        />
      ) : (
        <BeatInspector beat={entity as Beat} spaces={project.spaces} onUpdateBeat={onUpdateBeat} />
      )}
    </section>
  );
}
