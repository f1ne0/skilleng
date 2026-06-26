import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Flame, Zap } from 'lucide-react'

function useTicker(value: number, durationMs = 800): number {
  const [display, setDisplay] = useState(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = display
    const delta = value - start
    if (delta === 0) return
    const t0 = performance.now()
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs)
      setDisplay(Math.round(start + delta * ease(t)))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs])
  return display
}

export interface StatsGroupProps {
  streakDays: number
  xp: number
}

export function StatsGroup({ streakDays, xp }: StatsGroupProps) {
  const xpDisplay = useTicker(xp)
  return (
    <Flex
      align="center"
      h="36px"
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="full"
      overflow="hidden"
      boxShadow="0 1px 2px rgba(15,23,42,0.04)"
    >
      {/* Streak segment */}
      <Flex
        align="center"
        gap="6px"
        h="100%"
        px="12px"
        title={`${streakDays}-day streak`}
        _hover={{ bg: 'bg.subtle' }}
        transition="background 150ms"
        cursor="default"
      >
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-flex' }}
        >
          <Box color="warning" display="inline-flex">
            <Flame size={13} fill="currentColor" strokeWidth={2.2} />
          </Box>
        </motion.span>
        <Text fontSize="sm" fontWeight="semibold" color="text.primary" lineHeight="none" fontFamily="mono">
          {streakDays}
        </Text>
      </Flex>

      <Box w="1px" h="16px" bg="border.subtle" />

      {/* XP segment */}
      <Flex
        align="center"
        gap="6px"
        h="100%"
        px="12px"
        title={`${xp} XP`}
        _hover={{ bg: 'bg.subtle' }}
        transition="background 150ms"
        cursor="default"
      >
        <Box color="accent.text" display="inline-flex">
          <Zap size={13} fill="currentColor" strokeWidth={2.2} />
        </Box>
        <Text fontSize="sm" fontWeight="semibold" color="text.primary" lineHeight="none" fontFamily="mono">
          {xpDisplay.toLocaleString()}
        </Text>
      </Flex>
    </Flex>
  )
}
