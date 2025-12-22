import React from 'react';
import { User } from 'lucide-react';
import { XStack, Text, styled, useTheme } from '@unicornlove/ui';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  shape?: 'circle' | 'square';
}

const AvatarContainer = styled(XStack, {
  name: 'AvatarContainer',
  position: 'relative',
  display: 'inline-block',
});

const AvatarBox = styled(XStack, {
  name: 'AvatarBox',
  backgroundColor: '$primary3',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  variants: {
    size: {
      xs: { width: 24, height: 24, fontSize: '$1' }, // w-6 h-6 text-xs
      sm: { width: 32, height: 32, fontSize: '$2' }, // w-8 h-8 text-sm
      md: { width: 40, height: 40, fontSize: '$3' }, // w-10 h-10 text-base
      lg: { width: 48, height: 48, fontSize: '$4' }, // w-12 h-12 text-lg
      xl: { width: 64, height: 64, fontSize: '$5' }, // w-16 h-16 text-xl
      '2xl': { width: 80, height: 80, fontSize: '$6' }, // w-20 h-20 text-2xl
    },
    shape: {
      circle: { borderRadius: '$full' },
      square: { borderRadius: '$4' },
    },
  } as const,
});

const StatusIndicator = styled(XStack, {
  name: 'StatusIndicator',
  position: 'absolute',
  bottom: 0,
  right: 0,
  borderWidth: 2,
  borderColor: '$background',
  borderRadius: '$full',
  variants: {
    size: {
      xs: { width: 6, height: 6 }, // w-1.5 h-1.5
      sm: { width: 8, height: 8 }, // w-2 h-2
      md: { width: 10, height: 10 }, // w-2.5 h-2.5
      lg: { width: 12, height: 12 }, // w-3 h-3
      xl: { width: 14, height: 14 }, // w-3.5 h-3.5
      '2xl': { width: 16, height: 16 }, // w-4 h-4
    },
    status: {
      online: { backgroundColor: '$green9' },
      offline: { backgroundColor: '$gray7' },
      away: { backgroundColor: '$orange9' },
      busy: { backgroundColor: '$red9' },
    },
  } as const,
});

const getInitials = (name?: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export default function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className = '',
  status,
  shape = 'circle',
}: AvatarProps) {
  const theme = useTheme();

  return (
    <AvatarContainer className={className}>
      <AvatarBox size={size} shape={shape}>
        {src ? (
          <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : fallback ? (
          <Text fontWeight="600" color="$primary11">
            {getInitials(fallback)}
          </Text>
        ) : (
          <User
            color={theme.primary11.val}
            size={size === 'xs' ? 12 : size === 'sm' ? 16 : 20}
          />
        )}
      </AvatarBox>
      {status && (
        <StatusIndicator size={size} status={status} />
      )}
    </AvatarContainer>
  );
}

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

const AvatarGroupContainer = styled(XStack, {
  name: 'AvatarGroupContainer',
  alignItems: 'center',
});

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  className = '',
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <AvatarGroupContainer className={className}>
      {visibleAvatars.map((avatar, index) => (
        <XStack
          key={index}
          marginLeft={index > 0 ? '$-2' : '$0'}
          borderWidth={2}
          borderColor="$background"
          borderRadius="$full"
        >
          <Avatar {...avatar} size={size} />
        </XStack>
      ))}
      {remainingCount > 0 && (
        <XStack
          marginLeft="$-2"
          borderWidth={2}
          borderColor="$background"
          borderRadius="$full"
        >
          <AvatarBox size={size} shape="circle" backgroundColor="$gray5">
            <Text fontWeight="600" color="$color11">
              +{remainingCount}
            </Text>
          </AvatarBox>
        </XStack>
      )}
    </AvatarGroupContainer>
  );
}
