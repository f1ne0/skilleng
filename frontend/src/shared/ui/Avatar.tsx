import type { ReactNode } from 'react'
import { Box, Image } from '@chakra-ui/react'

export interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  fallback?: ReactNode
}

const sizeMap = {
  xs: { box: '24px', font: '10px' },
  sm: { box: '32px', font: '12px' },
  md: { box: '40px', font: '14px' },
  lg: { box: '56px', font: '18px' },
  xl: { box: '80px', font: '24px' },
} as const

function initialsOf(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export function Avatar({ src, name, size = 'md', ring = false, fallback }: AvatarProps) {
  const s = sizeMap[size]
  return (
    <Box
      width={s.box}
      height={s.box}
      borderRadius="full"
      bg="accent.surface"
      color="accent.text"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      fontSize={s.font}
      fontWeight="semibold"
      overflow="hidden"
      border={ring ? '2px solid' : '1px solid'}
      borderColor={ring ? 'accent.solid' : 'border.subtle'}
      flexShrink={0}
      userSelect="none"
    >
      {src ? (
        <Image src={src} alt={name ?? ''} width="100%" height="100%" objectFit="cover" />
      ) : (
        fallback ?? initialsOf(name)
      )}
    </Box>
  )
}
