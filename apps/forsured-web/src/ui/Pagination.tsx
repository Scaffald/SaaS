/**
 * Pagination wrapper
 * Provides backwards-compatible API for existing code
 */
import React from 'react'
import { Pagination as BeyondPagination } from '@scaffald/ui'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  siblingCount?: number
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  className = '',
}: PaginationProps) {
  return (
    <BeyondPagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      siblingCount={siblingCount}
      type="numbers"
      pageRadius="rounded"
    />
  )
}
