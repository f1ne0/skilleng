import type { ComponentPropsWithoutRef } from 'react'
import { Box } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const shimmer = keyframes({
  '0%':   { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
})

export interface SkeletonProps extends ComponentPropsWithoutRef<'div'> {
  width?: string | number
  height?: string | number
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  // Chakra-style алиасы: по факту и так прокидывались в Box через ...rest,
  // здесь только типизация для использований вида <Skeleton h="48px" borderRadius="md" />
  h?: string | number
  w?: string | number
  borderRadius?: string
  mb?: string | number
}

export function Skeleton({ width = '100%', height = '14px', radius = 'md', ...rest }: SkeletonProps) {
  return (
    <Box
      width={width}
      height={height}
      borderRadius={radius}
      bg="bg.subtle"
      backgroundImage="linear-gradient(90deg, transparent 0%, var(--se-colors-bg-muted) 50%, transparent 100%)"
      backgroundSize="200% 100%"
      animation={`${shimmer} 1.5s linear infinite`}
      {...(rest as Record<string, unknown>)}
    />
  )
}
