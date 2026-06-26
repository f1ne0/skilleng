import { Box } from '@chakra-ui/react'
import type { CourseTone } from '@entities/course'

const TONE_GRADIENT: Record<CourseTone, string> = {
  emerald:
    'radial-gradient(circle at 25% 25%, rgba(16,185,129,0.55), transparent 55%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.30), transparent 50%), linear-gradient(135deg, #0B1F1A, #081320)',
  blue:
    'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.55), transparent 55%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.30), transparent 50%), linear-gradient(135deg, #0E1A2A, #081020)',
  amber:
    'radial-gradient(circle at 25% 25%, rgba(245,158,11,0.50), transparent 55%), radial-gradient(circle at 80% 80%, rgba(217,70,239,0.20), transparent 50%), linear-gradient(135deg, #1F1810, #0F0B07)',
  violet:
    'radial-gradient(circle at 25% 25%, rgba(139,92,246,0.50), transparent 55%), radial-gradient(circle at 80% 80%, rgba(217,70,239,0.30), transparent 50%), linear-gradient(135deg, #14102A, #0A081A)',
  rose:
    'radial-gradient(circle at 25% 25%, rgba(244,63,94,0.45), transparent 55%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.30), transparent 50%), linear-gradient(135deg, #1F1018, #14080F)',
}

export interface CourseCoverProps {
  tone: CourseTone
  height?: string
  radius?: string | number
  glyph?: string
  children?: React.ReactNode
}

export function CourseCover({ tone, height = '120px', radius = 'lg', glyph, children }: CourseCoverProps) {
  return (
    <Box
      h={height}
      borderRadius={radius}
      position="relative"
      overflow="hidden"
      background={TONE_GRADIENT[tone]}
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)"
    >
      <Box
        position="absolute"
        inset="0"
        backgroundImage="radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)"
        backgroundSize="14px 14px"
        opacity={0.55}
      />
      {glyph && (
        <Box
          position="absolute"
          right="-12px"
          bottom="-22px"
          fontSize="120px"
          fontWeight="semibold"
          color="rgba(255,255,255,0.10)"
          fontFamily="heading"
          letterSpacing="-0.04em"
          lineHeight="none"
          userSelect="none"
        >
          {glyph}
        </Box>
      )}
      {children}
    </Box>
  )
}
