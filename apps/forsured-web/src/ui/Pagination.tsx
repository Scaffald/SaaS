import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { XStack, Button, Text, styled } from '@unicornlove/ui';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  siblingCount?: number;
  className?: string;
}

const PaginationNav = styled(XStack, {
  name: 'PaginationNav',
  alignItems: 'center',
  gap: '$1',
});

const PageButton = styled(Button, {
  name: 'PageButton',
  width: 40, // w-10
  height: 40, // h-10
  borderRadius: '$4',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease-in-out',
  variants: {
    active: {
      true: {
        backgroundColor: '$primary9',
        color: '$color1',
        hoverStyle: {
          backgroundColor: '$primary10',
        },
      },
      false: {
        color: '$color10',
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: '$backgroundSecondary',
          color: '$color11',
        },
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      false: {},
    },
  } as const,
});

const DotsText = styled(Text, {
  name: 'PaginationDots',
  width: 40,
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
  color: '$color9',
});

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  className = '',
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (showLeftDots) {
        pages.push('...');
      }

      for (let i = leftSibling; i <= rightSibling; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (showRightDots) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <PaginationNav as="nav" className={className} aria-label="Pagination">
      {showFirstLast && (
        <PageButton
          onPress={() => onPageChange(1)}
          disabled={currentPage === 1}
          active={false}
          aria-label="First page"
        >
          <ChevronsLeft size={18} />
        </PageButton>
      )}
      <PageButton
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        active={false}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </PageButton>

      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <DotsText key={`dots-${index}`}>
              ...
            </DotsText>
          );
        }

        const pageNumber = page as number;
        const isActive = pageNumber === currentPage;

        return (
          <PageButton
            key={pageNumber}
            onPress={() => onPageChange(pageNumber)}
            active={isActive}
            disabled={false}
            aria-label={`Page ${pageNumber}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNumber}
          </PageButton>
        );
      })}

      <PageButton
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        active={false}
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </PageButton>
      {showFirstLast && (
        <PageButton
          onPress={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          active={false}
          aria-label="Last page"
        >
          <ChevronsRight size={18} />
        </PageButton>
      )}
    </PaginationNav>
  );
}
