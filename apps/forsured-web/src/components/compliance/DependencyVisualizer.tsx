/**
 * Dependency Visualizer
 * REQ-2, TASK-15: Interactive dependency graph visualization
 *
 * Features:
 * - SVG-based tree/graph visualization
 * - Interactive nodes (click to select, view details)
 * - Color-coded by coverage type
 * - Zoom and pan support
 * - Dependency type labels on edges
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, AlertTriangle, Info } from 'lucide-react';
import type { DependencyNode } from '../../lib/compliance/dependency-resolver';
import type { CoverageType } from '../../lib/compliance/dependency-types';
import { DependencyType } from '../../lib/compliance/dependency-types';
import { trpc } from '../../lib/trpc';
import Button from '../Common/Button';

// =============================================================================
// Types & Configuration
// =============================================================================

interface DependencyVisualizerProps {
  organizationId: string;
  requirementId: string;
  maxDepth?: number;
  onNodeClick?: (nodeId: string) => void;
}

interface Position {
  x: number;
  y: number;
}

interface NodePositions {
  [nodeId: string]: Position;
}

interface SelectedNode {
  id: string;
  name: string;
  type: string;
  depth: number;
  dependency_type: DependencyType | null;
}

// Colors for coverage types
const typeColors: Record<CoverageType, { bg: string; border: string; text: string }> = {
  general_liability: { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' },
  umbrella_liability: { bg: '#F3E8FF', border: '#9333EA', text: '#7E22CE' },
  auto_liability: { bg: '#ECFEFF', border: '#06B6D4', text: '#0891B2' },
  workers_comp: { bg: '#FFFBEB', border: '#F59E0B', text: '#D97706' },
  professional_liability: { bg: '#EEF2FF', border: '#6366F1', text: '#4F46E5' },
  excess_liability: { bg: '#F5F3FF', border: '#8B5CF6', text: '#7C3AED' },
};

// Default color for unknown types
const defaultColor = { bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563' };

// Dependency type labels
const dependencyTypeLabels: Record<DependencyType, string> = {
  [DependencyType.REQUIRES]: 'requires',
  [DependencyType.RECOMMENDED]: 'recommended',
  [DependencyType.ALTERNATIVE]: 'alternative',
};

// Layout constants
const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 100;
const PADDING = 40;

// =============================================================================
// Layout Algorithm (Simple Tree Layout)
// =============================================================================

/**
 * Calculate positions for nodes in a tree layout
 */
function calculateTreeLayout(tree: DependencyNode): NodePositions {
  const positions: NodePositions = {};
  const levelWidths: number[] = [];

  // First pass: count nodes at each level
  function countLevels(node: DependencyNode): void {
    while (levelWidths.length <= node.depth) {
      levelWidths.push(0);
    }
    levelWidths[node.depth]++;
    for (const child of node.children) {
      countLevels(child);
    }
  }
  countLevels(tree);

  // Second pass: assign positions
  const levelCounters: number[] = levelWidths.map(() => 0);

  function assignPositions(node: DependencyNode): void {
    const levelWidth = levelWidths[node.depth];
    const currentIndex = levelCounters[node.depth]++;

    // Center nodes horizontally within their level
    const totalWidth = levelWidth * (NODE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;
    const startX = PADDING + (totalWidth > 0 ? -totalWidth / 2 : 0);

    positions[node.id] = {
      x: startX + currentIndex * (NODE_WIDTH + HORIZONTAL_SPACING) + totalWidth / 2,
      y: PADDING + node.depth * (NODE_HEIGHT + VERTICAL_SPACING),
    };

    for (const child of node.children) {
      assignPositions(child);
    }
  }
  assignPositions(tree);

  return positions;
}

/**
 * Calculate SVG viewBox dimensions from positions
 */
function calculateViewBox(positions: NodePositions): { minX: number; minY: number; width: number; height: number } {
  const posValues = Object.values(positions);
  if (posValues.length === 0) {
    return { minX: 0, minY: 0, width: 400, height: 300 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pos of posValues) {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + NODE_WIDTH);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
  }

  return {
    minX: minX - PADDING,
    minY: minY - PADDING,
    width: maxX - minX + PADDING * 2,
    height: maxY - minY + PADDING * 2,
  };
}

// =============================================================================
// Visualization Components
// =============================================================================

interface GraphNodeProps {
  node: DependencyNode;
  position: Position;
  isSelected: boolean;
  onClick: (node: DependencyNode) => void;
}

function GraphNode({ node, position, isSelected, onClick }: GraphNodeProps) {
  const colors = typeColors[node.type as CoverageType] || defaultColor;

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={() => onClick(node)}
      style={{ cursor: 'pointer' }}
    >
      {/* Node rectangle */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        fill={colors.bg}
        stroke={isSelected ? '#2563EB' : colors.border}
        strokeWidth={isSelected ? 3 : 2}
        className="transition-all duration-200 hover:stroke-[3]"
      />

      {/* Node name */}
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 - 6}
        textAnchor="middle"
        fill={colors.text}
        fontSize={12}
        fontWeight={600}
      >
        {node.name.length > 18 ? `${node.name.substring(0, 16)}...` : node.name}
      </text>

      {/* Coverage type label */}
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 + 12}
        textAnchor="middle"
        fill={colors.text}
        fontSize={10}
        opacity={0.7}
      >
        {node.type.replace('_', ' ')}
      </text>

      {/* Depth indicator */}
      {node.depth > 0 && (
        <text
          x={NODE_WIDTH - 8}
          y={16}
          textAnchor="end"
          fill={colors.text}
          fontSize={9}
          opacity={0.5}
        >
          L{node.depth}
        </text>
      )}
    </g>
  );
}

interface GraphEdgeProps {
  fromPos: Position;
  toPos: Position;
  dependencyType: DependencyType | null;
}

function GraphEdge({ fromPos, toPos, dependencyType }: GraphEdgeProps) {
  // Calculate edge path (from bottom center of parent to top center of child)
  const startX = fromPos.x + NODE_WIDTH / 2;
  const startY = fromPos.y + NODE_HEIGHT;
  const endX = toPos.x + NODE_WIDTH / 2;
  const endY = toPos.y;

  // Calculate midpoint for label
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // Create a curved path
  const controlY = startY + (endY - startY) / 3;

  return (
    <g>
      {/* Edge line */}
      <path
        d={`M ${startX} ${startY} Q ${startX} ${controlY}, ${midX} ${midY} T ${endX} ${endY}`}
        fill="none"
        stroke="#94A3B8"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />

      {/* Dependency type label */}
      {dependencyType && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-30}
            y={-8}
            width={60}
            height={16}
            rx={4}
            fill="#F1F5F9"
            stroke="#CBD5E1"
            strokeWidth={1}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill="#64748B"
            fontSize={9}
          >
            {dependencyTypeLabels[dependencyType] || dependencyType}
          </text>
        </g>
      )}
    </g>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function DependencyVisualizer({
  organizationId,
  requirementId,
  maxDepth = 5,
  onNodeClick,
}: DependencyVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  // Fetch dependency tree
  const {
    data: tree,
    isLoading,
    error,
  } = trpc.complianceDependencies.getTree.useQuery(
    {
      organizationId,
      requirementId,
      maxDepth,
    },
    {
      enabled: !!organizationId && !!requirementId,
    }
  );

  // Calculate layout
  const { positions, viewBox } = useMemo(() => {
    if (!tree) {
      return {
        positions: {},
        viewBox: { minX: 0, minY: 0, width: 400, height: 300 },
      };
    }

    const pos = calculateTreeLayout(tree);
    const box = calculateViewBox(pos);

    return { positions: pos, viewBox: box };
  }, [tree]);

  // Collect all edges
  const edges = useMemo(() => {
    if (!tree) return [];

    const edgeList: Array<{
      fromId: string;
      toId: string;
      dependencyType: DependencyType | null;
    }> = [];

    function collectEdges(node: DependencyNode): void {
      for (const child of node.children) {
        edgeList.push({
          fromId: node.id,
          toId: child.id,
          dependencyType: child.dependency_type,
        });
        collectEdges(child);
      }
    }

    collectEdges(tree);
    return edgeList;
  }, [tree]);

  // Collect all nodes for rendering
  const nodes = useMemo(() => {
    if (!tree) return [];

    const nodeList: DependencyNode[] = [];

    function collectNodes(node: DependencyNode): void {
      nodeList.push(node);
      for (const child of node.children) {
        collectNodes(child);
      }
    }

    collectNodes(tree);
    return nodeList;
  }, [tree]);

  // Handle node click
  const handleNodeClick = useCallback(
    (node: DependencyNode) => {
      setSelectedNode({
        id: node.id,
        name: node.name,
        type: node.type,
        depth: node.depth,
        dependency_type: node.dependency_type,
      });
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.2, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pan controls
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(Math.max(z * delta, 0.3), 3));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-bg-secondary rounded-lg border border-border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-error-50 rounded-lg border border-error-200">
        <AlertTriangle className="text-error-500 mb-2" size={32} />
        <p className="text-error-700 font-medium">Failed to load dependency tree</p>
        <p className="text-error-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-bg-secondary rounded-lg border border-border">
        <Info className="text-text-tertiary mb-2" size={32} />
        <p className="text-text-secondary">No dependency data available</p>
      </div>
    );
  }

  // No dependencies state
  if (tree.children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-bg-secondary rounded-lg border border-border">
        <div className="p-4 bg-surface rounded-lg border border-border text-center">
          <Info className="text-text-tertiary mx-auto mb-2" size={32} />
          <p className="text-text-secondary font-medium">No dependencies</p>
          <p className="text-text-tertiary text-sm mt-1">
            This requirement has no dependencies defined
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 bg-bg-secondary border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleResetView} title="Reset View">
            <Maximize size={16} />
          </Button>
          <span className="text-xs text-text-tertiary ml-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="text-sm text-text-secondary">
          {nodes.length} node{nodes.length !== 1 ? 's' : ''} | {edges.length} edge
          {edges.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-white cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${viewBox.minX - pan.x / zoom} ${viewBox.minY - pan.y / zoom} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
        >
          {/* Defs for arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              fill="#94A3B8"
            >
              <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
          </defs>

          {/* Edges */}
          <g>
            {edges.map((edge) => {
              const fromPos = positions[edge.fromId];
              const toPos = positions[edge.toId];
              if (!fromPos || !toPos) return null;

              return (
                <GraphEdge
                  key={`${edge.fromId}-${edge.toId}`}
                  fromPos={fromPos}
                  toPos={toPos}
                  dependencyType={edge.dependencyType}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => {
              const position = positions[node.id];
              if (!position) return null;

              return (
                <GraphNode
                  key={node.id}
                  node={node}
                  position={position}
                  isSelected={selectedNode?.id === node.id}
                  onClick={handleNodeClick}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="p-3 bg-bg-secondary border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-text-primary">{selectedNode.name}</h4>
              <p className="text-sm text-text-secondary">
                {selectedNode.type.replace('_', ' ')} | Level {selectedNode.depth}
                {selectedNode.dependency_type && (
                  <span className="ml-2">
                    ({dependencyTypeLabels[selectedNode.dependency_type] || selectedNode.dependency_type})
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 bg-bg-secondary border-t border-border">
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(typeColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.bg, border: `2px solid ${colors.border}` }}
              />
              <span className="text-text-secondary capitalize">
                {type.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DependencyVisualizer;
