import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Box } from '@chakra-ui/react'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info'
export type BadgeShape = 'tag' | 'pill'
export type BadgeIntensity = 'subtle' | 'solid'

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone
  shape?: BadgeShape
  intensity?: BadgeIntensity
  leftIcon?: ReactNode
  children?: ReactNode
}

const subtleTones: Record<BadgeTone, { bg: string; color: string; border: string }> = {
  neutral: { bg: 'bg.subtle',         color: 'text.secondary', border: 'border.subtle' },
  accent:  { bg: 'accent.surface',    color: 'accent.text',    border: 'border.accent' },
  success: { bg: 'accent.surface',    color: 'accent.text',    border: 'border.accent' },
  warning: { bg: 'rgba(245,158,11,0.10)', color: 'warning',    border: 'rgba(245,158,11,0.30)' },
  error:   { bg: 'rgba(244,63,94,0.10)',  color: 'error',      border: 'rgba(244,63,94,0.30)' },
  info:    { bg: 'rgba(59,130,246,0.10)', color: 'info',       border: 'rgba(59,130,246,0.30)' },
}

const solidTones: Record<BadgeTone, { bg: string; color: string; border: string }> = {
  neutral: { bg: 'bg.muted',         color: 'text.primary', border: 'border.default' },
  accent:  { bg: 'accent.solid',     color: 'text.onAccent', border: 'accent.solid' },
  success: { bg: 'accent.solid',     color: 'text.onAccent', border: 'accent.solid' },
  warning: { bg: 'warning',          color: 'text.onAccent', border: 'warning' },
  error:   { bg: 'error',            color: 'text.onAccent', border: 'error' },
  info:    { bg: 'info',             color: 'text.onAccent', border: 'info' },
}

export function Badge({
  tone = 'neutral',
  shape = 'tag',
  intensity = 'subtle',
  leftIcon,
  children,
  ...rest
}: BadgeProps) {
  const t = (intensity === 'solid' ? solidTones : subtleTones)[tone]
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap="6px"
      h="24px"
      px={shape === 'pill' ? '12px' : '8px'}
      fontSize="xs"
      fontWeight="medium"
      lineHeight="none"
      borderRadius={shape === 'pill' ? 'full' : 'md'}
      bg={t.bg}
      color={t.color}
      border="1px solid"
      borderColor={t.border}
      whiteSpace="nowrap"
      transition="background 200ms cubic-bezier(0.4,0,0.2,1), color 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms cubic-bezier(0.4,0,0.2,1)"
      {...(rest as Record<string, unknown>)}
    >
      {leftIcon}
      {children}
    </Box>
  )
}
