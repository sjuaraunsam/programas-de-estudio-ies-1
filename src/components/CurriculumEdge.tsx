import React, { memo, useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, useInternalNode, EdgeLabelRenderer } from '@xyflow/react';
import { SubjectState } from '../types';

export type CurriculumEdgeData = {
  sourceState: SubjectState;
  isActive: boolean; // source is signed or passed
};

const STATE_COLORS: Record<SubjectState, string> = {
  pending: '#f97316',
  'in-progress': '#f97316',
  signed: '#84cc16',
  passed: '#047857',
};

function toRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const CurriculumEdge = memo(({
  id, source, target,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  selected, data,
}: EdgeProps) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  const edgeData = data as CurriculumEdgeData | undefined;
  const sourceState = edgeData?.sourceState ?? 'pending';
  const isActive = edgeData?.isActive ?? false;
  const color = STATE_COLORS[sourceState];

  // Recalculate connection points to come from the card edges
  let srcX = sourceX, srcY = sourceY;
  let tgtX = targetX, tgtY = targetY;
  let srcPos = sourcePosition, tgtPos = targetPosition;

  const sAbsPos = sourceNode?.internals?.positionAbsolute;
  const tAbsPos = targetNode?.internals?.positionAbsolute;
  const sW = sourceNode?.measured?.width ?? 260;
  const sH = sourceNode?.measured?.height ?? 140;
  const tW = targetNode?.measured?.width ?? 260;
  const tH = targetNode?.measured?.height ?? 140;

  if (sAbsPos && tAbsPos) {
    // Use right edge of source and left edge of target
    srcX = sAbsPos.x + sW;
    srcY = sAbsPos.y + sH / 2;
    tgtX = tAbsPos.x;
    tgtY = tAbsPos.y + tH / 2;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: srcX,
    sourceY: srcY,
    targetX: tgtX,
    targetY: tgtY,
    curvature: 0.3,
  });

  return (
    <>
      {/* Glow aura */}
      <path
        d={edgePath}
        fill="none"
        stroke={toRgba(color, selected ? 0.4 : 0.2)}
        strokeWidth={selected ? 12 : 8}
        strokeLinecap="round"
      />
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 2,
          strokeLinecap: 'round',
          filter: `drop-shadow(0 0 4px ${toRgba(color, selected ? 0.7 : 0.4)})`,
        }}
        markerEnd={`url(#arrow-${sourceState})`}
        interactionWidth={16}
      />
      {/* Animated flow dashes — only if edge is active (source passed/signed) */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1.5}
          strokeDasharray="6 12"
          strokeLinecap="round"
          style={{ animation: 'flowDash 1.2s linear infinite' }}
        />
      )}
    </>
  );
});

CurriculumEdge.displayName = 'CurriculumEdge';
export default CurriculumEdge;

// SVG defs for arrowheads — render once in the canvas
export function CurriculumEdgeDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {(['pending', 'in-progress', 'signed', 'passed'] as SubjectState[]).map(state => (
          <marker
            key={state}
            id={`arrow-${state}`}
            markerWidth="10" markerHeight="7"
            refX="9" refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={STATE_COLORS[state]} />
          </marker>
        ))}
      </defs>
    </svg>
  );
}
