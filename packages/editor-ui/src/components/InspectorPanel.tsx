import { useEffect, useState } from 'react';

import type { EntityRef, ProjectGraph, Space } from '@labyrinth/schema';

type InspectorPanelProps = {
  selectedEntity: EntityRef | null;
  selectedSpace: Space | undefined;
  onUpdateSpace(id: string, patch: Partial<ProjectGraph['spaces'][string]>): void;
};

export function InspectorPanel({
  selectedEntity,
  selectedSpace,
  onUpdateSpace
}: InspectorPanelProps) {
  const [name, setName] = useState(selectedSpace?.name ?? '');

  useEffect(() => {
    setName(selectedSpace?.name ?? '');
  }, [selectedSpace?.id, selectedSpace?.name]);

  if (selectedEntity === null) {
    return (
      <section className="lc-panel-section">
        <div className="lc-section-label">Inspector</div>
        <p className="lc-panel-copy">Select an entity to edit its properties.</p>
      </section>
    );
  }

  if (selectedSpace === undefined) {
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
      <label className="lc-field">
        <span>Name</span>
        <input
          value={name}
          onBlur={() => onUpdateSpace(selectedSpace.id, { name })}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <div className="lc-entity-id">space:{selectedSpace.id}</div>
    </section>
  );
}
