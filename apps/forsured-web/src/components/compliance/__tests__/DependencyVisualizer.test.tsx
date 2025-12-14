/**
 * DependencyVisualizer Tests
 * REQ-2, TASK-15: Tests for dependency visualizer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DependencyVisualizer from '../DependencyVisualizer';
import type { DependencyNode } from '../../../lib/compliance/dependency-resolver';
import { DependencyType } from '../../../lib/compliance/dependency-types';

// Mock data - keep names short (under 18 chars) to avoid truncation issues in tests
const mockTree: DependencyNode = {
  id: 'req-1',
  name: 'GL $1M Limit',
  type: 'general_liability',
  depth: 0,
  dependency_type: null,
  children: [
    {
      id: 'req-2',
      name: 'Umbrella $2M',
      type: 'umbrella_liability',
      depth: 1,
      dependency_type: DependencyType.REQUIRES,
      children: [],
    },
    {
      id: 'req-3',
      name: 'Auto $500K',
      type: 'auto_liability',
      depth: 1,
      dependency_type: DependencyType.RECOMMENDED,
      children: [
        {
          id: 'req-4',
          name: 'Workers Comp',
          type: 'workers_comp',
          depth: 2,
          dependency_type: DependencyType.ALTERNATIVE,
          children: [],
        },
      ],
    },
  ],
};

const mockEmptyTree: DependencyNode = {
  id: 'req-single',
  name: 'Single Requirement',
  type: 'general_liability',
  depth: 0,
  dependency_type: null,
  children: [],
};

// Mock tRPC
const mockUseQuery = vi.fn();

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    complianceDependencies: {
      getTree: {
        useQuery: (args: unknown, options: unknown) => mockUseQuery(args, options),
      },
    },
  },
}));

// Mock Button component
vi.mock('../../Common/Button', () => ({
  default: ({ children, onClick, variant, size, title, disabled }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    title?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

describe('DependencyVisualizer', () => {
  const defaultProps = {
    organizationId: 'org-123',
    requirementId: 'req-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: mockTree,
      isLoading: false,
      error: null,
    });
  });

  describe('Loading State', () => {
    it('renders loading spinner when fetching data', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<DependencyVisualizer {...defaultProps} />);

      // Check for loading indicator
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when query fails', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to fetch tree' },
      });

      render(<DependencyVisualizer {...defaultProps} />);

      expect(screen.getByText('Failed to load dependency tree')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch tree')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders no data message when tree is null', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<DependencyVisualizer {...defaultProps} />);

      expect(screen.getByText('No dependency data available')).toBeInTheDocument();
    });

    it('renders no dependencies message when tree has no children', () => {
      mockUseQuery.mockReturnValue({
        data: mockEmptyTree,
        isLoading: false,
        error: null,
      });

      render(<DependencyVisualizer {...defaultProps} />);

      expect(screen.getByText('No dependencies')).toBeInTheDocument();
      expect(screen.getByText('This requirement has no dependencies defined')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('renders SVG graph when data is loaded', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      // Check for SVG element
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders all nodes from tree', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      // Check for node names in the SVG
      expect(screen.getByText('GL $1M Limit')).toBeInTheDocument();
      expect(screen.getByText('Umbrella $2M')).toBeInTheDocument();
      expect(screen.getByText('Auto $500K')).toBeInTheDocument();
      expect(screen.getByText('Workers Comp')).toBeInTheDocument();
    });

    it('displays node and edge counts', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      // 4 nodes total: req-1, req-2, req-3, req-4
      expect(screen.getByText(/4 nodes/)).toBeInTheDocument();
      // 3 edges: req-1->req-2, req-1->req-3, req-3->req-4
      expect(screen.getByText(/3 edges/)).toBeInTheDocument();
    });

    it('renders legend with coverage types', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      // Check legend items exist by checking for legend container and items
      // The legend is in the last div with flex-wrap
      const legendContainer = document.querySelector('.flex.flex-wrap.gap-3');
      expect(legendContainer).toBeInTheDocument();

      // Check for colored boxes in legend (w-3 h-3 rounded)
      const legendBoxes = document.querySelectorAll('.w-3.h-3.rounded');
      expect(legendBoxes.length).toBeGreaterThanOrEqual(6); // 6 coverage types
    });
  });

  describe('Zoom Controls', () => {
    it('renders zoom controls', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset View')).toBeInTheDocument();
    });

    it('displays initial zoom percentage', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('updates zoom on zoom in click', async () => {
      const user = userEvent.setup();
      render(<DependencyVisualizer {...defaultProps} />);

      await user.click(screen.getByTitle('Zoom In'));

      // 100 * 1.2 = 120
      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('updates zoom on zoom out click', async () => {
      const user = userEvent.setup();
      render(<DependencyVisualizer {...defaultProps} />);

      await user.click(screen.getByTitle('Zoom Out'));

      // 100 / 1.2 ≈ 83
      expect(screen.getByText('83%')).toBeInTheDocument();
    });

    it('resets view on reset click', async () => {
      const user = userEvent.setup();
      render(<DependencyVisualizer {...defaultProps} />);

      // Zoom in first
      await user.click(screen.getByTitle('Zoom In'));
      expect(screen.getByText('120%')).toBeInTheDocument();

      // Reset
      await user.click(screen.getByTitle('Reset View'));
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Node Selection', () => {
    it('shows selected node details when clicking a node', async () => {
      const user = userEvent.setup();
      render(<DependencyVisualizer {...defaultProps} />);

      // Click on a node - find the g element containing the text
      const nodeText = screen.getByText('Umbrella $2M');
      const nodeGroup = nodeText.closest('g');
      if (nodeGroup) {
        await user.click(nodeGroup);
      }

      // Check selected node details appear
      await waitFor(() => {
        expect(screen.getByText('umbrella liability | Level 1')).toBeInTheDocument();
      });
    });

    it('calls onNodeClick callback when provided', async () => {
      const user = userEvent.setup();
      const onNodeClick = vi.fn();

      render(<DependencyVisualizer {...defaultProps} onNodeClick={onNodeClick} />);

      const nodeText = screen.getByText('Umbrella $2M');
      const nodeGroup = nodeText.closest('g');
      if (nodeGroup) {
        await user.click(nodeGroup);
      }

      await waitFor(() => {
        expect(onNodeClick).toHaveBeenCalledWith('req-2');
      });
    });

    it('clears selection when Clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<DependencyVisualizer {...defaultProps} />);

      // Select a node
      const nodeText = screen.getByText('Umbrella $2M');
      const nodeGroup = nodeText.closest('g');
      if (nodeGroup) {
        await user.click(nodeGroup);
      }

      // Wait for selection to appear
      await waitFor(() => {
        expect(screen.getByText('umbrella liability | Level 1')).toBeInTheDocument();
      });

      // Click Clear button
      await user.click(screen.getByText('Clear'));

      // Selection should be gone
      await waitFor(() => {
        expect(screen.queryByText('umbrella liability | Level 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Query Parameters', () => {
    it('passes correct parameters to query', () => {
      render(
        <DependencyVisualizer
          organizationId="org-456"
          requirementId="req-789"
          maxDepth={10}
        />
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        {
          organizationId: 'org-456',
          requirementId: 'req-789',
          maxDepth: 10,
        },
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('uses default maxDepth of 5', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          maxDepth: 5,
        }),
        expect.any(Object)
      );
    });

    it('disables query when organizationId is missing', () => {
      render(
        <DependencyVisualizer
          organizationId=""
          requirementId="req-1"
        />
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('disables query when requirementId is missing', () => {
      render(
        <DependencyVisualizer
          organizationId="org-123"
          requirementId=""
        />
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('Pan Functionality', () => {
    it('has grab cursor on graph container', () => {
      render(<DependencyVisualizer {...defaultProps} />);

      const container = document.querySelector('.cursor-grab');
      expect(container).toBeInTheDocument();
    });
  });
});
