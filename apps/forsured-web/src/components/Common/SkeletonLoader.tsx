/**
 * SkeletonLoader - Loading skeleton component using Beyond UI

 */
import React from 'react'
import { Skeleton, SkeletonText, SkeletonCard, Stack, Row } from '@scaffald/ui'

interface SkeletonLoaderProps {
  variant?: 'card' | 'table' | 'chart' | 'text'
  count?: number
}

export default function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <SkeletonCard />

      case 'table':
        return (
          <Stack gap={0}>
            <Stack padding={24} gap={8}>
              <Skeleton height={24} width="25%" />
              <Skeleton height={16} width="33%" />
            </Stack>
            <Stack>
              {[...Array(5)].map((_, i) => (
                <Row key={i} padding={24} alignItems="center" gap={16}>
                  <Skeleton height={48} width={48} shape="circle" />
                  <Stack flex={1} gap={8}>
                    <Skeleton height={16} width="25%" />
                    <Skeleton height={12} width="33%" />
                  </Stack>
                  <Skeleton height={32} width={80} />
                </Row>
              ))}
            </Stack>
          </Stack>
        )

      case 'chart':
        return (
          <Stack padding={24} gap={24}>
            <Skeleton height={24} width="33%" />
            <Stack gap={16}>
              {[...Array(6)].map((_, i) => (
                <Row key={i} alignItems="center" gap={12}>
                  <Skeleton height={16} width={64} />
                  <Skeleton height={32} style={{ flex: 1 }} />
                  <Skeleton height={16} width={64} />
                </Row>
              ))}
            </Stack>
          </Stack>
        )

      case 'text':
        return <SkeletonText lines={3} />

      default:
        return null
    }
  }

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <Stack key={index} style={{ marginBottom: count > 1 ? 16 : 0 }}>
          {renderSkeleton()}
        </Stack>
      ))}
    </>
  )
}

export function DashboardSkeleton() {
  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Skeleton height={32} width="25%" />
        <Skeleton height={16} width="33%" />
      </Stack>

      <Row gap={24} style={{ flexWrap: 'wrap' }}>
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </Row>

      <SkeletonLoader variant="chart" />
      <SkeletonLoader variant="table" />
    </Stack>
  )
}
