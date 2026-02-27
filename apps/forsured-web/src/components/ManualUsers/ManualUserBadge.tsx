/**
 * ManualUserBadge - Badge indicating a manually-added user
 * Manual user badge
 * "Manually Added" badge for manual users
 *
 * Shows a badge with tooltip explaining the user's manual status
 * and notification limitations.
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { UserX } from 'lucide-react'
import { Row, Text } from '@scaffald/ui'

interface ManualUserBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

/**
 * Badge sizes configuration
 */
const SIZES = {
  sm: {
    padding: '2px 6px',
    fontSize: 10,
    iconSize: 10,
    gap: 4,
  },
  md: {
    padding: '4px 8px',
    fontSize: 12,
    iconSize: 12,
    gap: 6,
  },
  lg: {
    padding: '6px 12px',
    fontSize: 14,
    iconSize: 14,
    gap: 8,
  },
}

/**
 * Tooltip explaining manual user status
 */
const TOOLTIP_TEXT =
  'This user was manually added and has not registered yet. They will not receive notifications until they complete registration.'

export function ManualUserBadge({ size = 'md', showTooltip = true }: ManualUserBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const sizeConfig = SIZES[size]

  // Position tooltip on mount/update
  useEffect(() => {
    if (!isTooltipVisible || !badgeRef.current || !tooltipRef.current) return

    const badge = badgeRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current

    // Position tooltip below badge
    tooltip.style.left = `${badge.left + badge.width / 2}px`
    tooltip.style.top = `${badge.bottom + 8}px`
    tooltip.style.transform = 'translateX(-50%)'
  }, [isTooltipVisible])

  return (
    <div
      ref={badgeRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onFocus={() => showTooltip && setIsTooltipVisible(true)}
      onBlur={() => setIsTooltipVisible(false)}
    >
      <Row
        alignItems="center"
        style={{
          padding: sizeConfig.padding,
          backgroundColor: 'var(--color-orange-3)',
          borderRadius: 4,
          gap: sizeConfig.gap,
          cursor: showTooltip ? 'help' : 'default',
        }}
        role="status"
        aria-label="Manually added user - will not receive notifications until registered"
        tabIndex={showTooltip ? 0 : -1}
      >
        <UserX
          size={sizeConfig.iconSize}
          style={{ color: 'var(--color-orange-11)' }}
          aria-hidden="true"
        />
        <Text
          style={{
            fontSize: sizeConfig.fontSize,
            fontWeight: 500,
            color: 'var(--color-orange-11)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          Manually Added
        </Text>
      </Row>

      {/* Tooltip */}
      {showTooltip && isTooltipVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            zIndex: 100,
            maxWidth: 280,
            padding: '8px 12px',
            backgroundColor: 'var(--color-gray-12)',
            color: 'white',
            fontSize: 12,
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            lineHeight: 1.4,
          }}
        >
          {TOOLTIP_TEXT}
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid var(--color-gray-12)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ManualUserBadge
