import { Background, Controls, ReactFlow, type Edge, type Node } from '@xyflow/react';

import type { EntityRef } from '@labyrinth/schema';
import type { GraphViewModel } from '@labyrinth/workbench';

type GraphCanvasProps = {
  graph: GraphViewModel;
  selectedEntity: EntityRef | null;
  onSelectEntity(entity: EntityRef | null): void;
};

export function GraphCanvas({ graph, selectedEntity, onSelectEntity }: GraphCanvasProps) {
  const nodes: Node[] = graph.nodes.map((node) => ({
    id: node.id,
    position: node.position,
    data: {
      label: node.title
    },
    selected: selectedEntity?.kind === 'space' && selectedEntity.id === node.id,
    className: `lc-flow-node lc-flow-node-${node.validationState}`,
    type: 'default'
  }));
  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    className: `lc-flow-edge lc-flow-edge-${edge.validationState}`
  }));

  return (
    <div className="lc-graph-canvas" aria-label="Graph canvas">
      <ReactFlow
        edges={edges}
        fitView
        nodes={nodes}
        nodesDraggable={false}
        onNodeClick={(_, node) => onSelectEntity({ kind: 'space', id: node.id })}
        onPaneClick={() => onSelectEntity(null)}
      >
        <Background color="rgba(39, 36, 31, 0.12)" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
