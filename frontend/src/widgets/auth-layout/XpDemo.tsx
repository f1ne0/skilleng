import { useEffect, useState } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Zap, BookOpen, CheckCircle2 } from 'lucide-react'
import { Card, Badge } from '@shared/ui'

/**
 * Animated marketing demo: floating cards + a ticking XP counter
 * that simulates a learner completing a lesson.
 */
export function XpDemo() {
  const [xp, setXp] = useState(1240)

  useEffect(() => {
    const id = window.setInterval(() => {
      setXp((v) => v + 10)
    }, 2200)
    return () => window.clearInterval(id)
  }, [])

  return (
    <Box position="relative" w="100%" h="100%" minH="520px">
      {/* Hero XP card — centered */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(360px, 80%)',
        }}
      >
        <Card padding="spacious">
          <Stack gap="14px">
            <Flex justify="space-between" align="center">
              <Badge tone="accent" shape="pill" leftIcon={<Flame size={12} />}>
                7-day streak
              </Badge>
              <Badge tone="neutral">B1 → B2</Badge>
            </Flex>

            <Box>
              <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
                Total XP
              </Text>
              <Flex align="baseline" gap="6px" mt="4px">
                <motion.span
                  key={xp}
                  initial={{ opacity: 0.45 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    fontSize: 48,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: 'var(--se-colors-text-primary)',
                    fontFamily: 'var(--se-fonts-heading)',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {xp.toLocaleString()}
                </motion.span>
                <Text fontSize="md" color="text.tertiary">XP</Text>
              </Flex>
            </Box>

            <Box>
              <Flex justify="space-between" mb="6px">
                <Text fontSize="xs" color="text.secondary">Progress to B2</Text>
                <Text fontSize="xs" color="accent.text" fontWeight="medium">65%</Text>
              </Flex>
              <Box w="100%" h="6px" bg="bg.muted" borderRadius="full" overflow="hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
                  style={{
                    height: '100%',
                    background:
                      'linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))',
                    borderRadius: 9999,
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Card>
      </motion.div>

      {/* Floating mini card — top right */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
        transition={{
          opacity: { duration: 0.5, delay: 0.2 },
          x: { duration: 0.5, delay: 0.2 },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
        }}
        style={{ position: 'absolute', top: '8%', right: '6%', width: 220 }}
      >
        <Card padding="tight">
          <Flex gap="10px" align="center">
            <Box
              w="36px"
              h="36px"
              borderRadius="md"
              bg="accent.surface"
              color="accent.text"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <CheckCircle2 size={18} />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" lineHeight="tight">
                Lesson complete
              </Text>
              <Text fontSize="xs" color="text.tertiary" mt="2px">
                +10 XP • Past Perfect
              </Text>
            </Box>
          </Flex>
        </Card>
      </motion.div>

      {/* Floating mini card — bottom left */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 0.5, delay: 0.35 },
          x: { duration: 0.5, delay: 0.35 },
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
        }}
        style={{ position: 'absolute', bottom: '10%', left: '4%', width: 240 }}
      >
        <Card padding="tight">
          <Stack gap="8px">
            <Flex align="center" gap="8px">
              <Trophy size={14} color="var(--se-colors-accent-text)" />
              <Text fontSize="xs" fontWeight="medium" color="accent.text" letterSpacing="wide" textTransform="uppercase">
                New milestone
              </Text>
            </Flex>
            <Text fontSize="sm" fontWeight="semibold">Vocabulary master</Text>
            <Text fontSize="xs" color="text.tertiary">500 words remembered</Text>
          </Stack>
        </Card>
      </motion.div>

      {/* Floating tag — top left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        style={{ position: 'absolute', top: '22%', left: '6%' }}
      >
        <Badge tone="accent" shape="pill" leftIcon={<Zap size={12} />}>
          AI tutor online
        </Badge>
      </motion.div>

      {/* Floating tag — bottom right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        style={{ position: 'absolute', bottom: '4%', right: '5%' }}
      >
        <Badge tone="neutral" shape="pill" leftIcon={<BookOpen size={12} />}>
          24 lessons available
        </Badge>
      </motion.div>
    </Box>
  )
}
