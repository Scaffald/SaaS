/**
 * Avatar wrapper
 * Provides backwards-compatible API for existing code
 */
import React from 'react'
import {
  Avatar as BeyondAvatar,
  AvatarGroup as BeyondAvatarGroup,
  type AvatarSize as BeyondAvatarSize,
  type AvatarStatus,
} from '@unicornlove/beyond-ui'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: AvatarSize
  className?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
  shape?: 'circle' | 'square'
}

// Map our size strings to Beyond UI's numeric sizes
const sizeMap: Record<AvatarSize, BeyondAvatarSize> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
}

// Helper to get initials from a name
const getInitials = (name?: string) => {
  if (!name) return ''
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export default function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className = '',
  status,
  shape = 'circle',
}: AvatarProps) {
  // Beyond UI Avatar is always circular; square shape not supported directly
  // For square avatars, you'd need custom styling
  return (
    <BeyondAvatar
      src={src}
      alt={alt}
      initials={fallback ? getInitials(fallback) : undefined}
      size={sizeMap[size]}
      status={status as AvatarStatus}
    />
  )
}

export interface AvatarGroupProps {
  avatars: AvatarProps[]
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarGroup({ avatars, max = 5, size = 'md', className = '' }: AvatarGroupProps) {
  return (
    <BeyondAvatarGroup max={max} size={sizeMap[size]}>
      {avatars.map((avatar, index) => (
        <BeyondAvatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          initials={avatar.fallback ? getInitials(avatar.fallback) : undefined}
          size={sizeMap[avatar.size || size]}
          status={avatar.status as AvatarStatus}
        />
      ))}
    </BeyondAvatarGroup>
  )
}
