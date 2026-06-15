import { Background, Controls, ReactFlow, type Edge, type Node } from '@xyflow/react';
import type { ReactNode } from 'react';

import type { EntityRef } from '@labyrinth/schema';
import type { GraphNodeViewModel, GraphViewModel } from '@labyrinth/workbench';

type GraphCanvasProps = {
  graph: GraphViewModel;
  selectedEntity: EntityRef | null;
  onSelectEntity(entity: EntityRef | null): void;
};

type FlowNodeData = {
  entityRef: EntityRef;
  label: ReactNode;
};

function isSelectedNode(node: GraphNodeViewModel, selectedEntity: EntityRef | null) {
  if (selectedEntity === null) {
    return false;
  }

  return selectedEntity.kind === node.entityRef.kind && selectedEntity.id === node.entityRef.id;
}

export function GraphCanvas({ graph, selectedEntity, onSelectEntity }: GraphCanvasProps) {
  const nodes: Node<FlowNodeData>[] = graph.nodes.map((node) => ({
    id: node.id,
    position: node.position,
    data: {
      entityRef: node.entityRef,
      label: (
        <div className="lc-flow-node-content">
          <strong>{node.title}</strong>
          {node.subtitle !== undefined ? <span>{node.subtitle}</span> : null}
        </div>
      )
    },
    selected: isSelectedNode(node, selectedEntity),
    className: `lc-flow-node lc-flow-node-${node.nodeKind} lc-flow-node-${node.validationState}`,
    style: {
      width: node.nodeKind === 'space' ? 168 : 132
    },
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
        fitViewOptions={{ padding: 0.28 }}
        minZoom={0.35}
        nodeOrigin={[0, 0]}
        nodes={nodes}
        nodesDraggable={false}
        onEdgeClick={(_, edge) => onSelectEntity({ kind: 'connection', id: edge.id })}
        onNodeClick={(_, node) => onSelectEntity(node.data.entityRef)}
        onPaneClick={() => onSelectEntity(null)}
      >
        <Background color="rgba(39, 36, 31, 0.12)" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
