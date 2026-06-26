import { useNavigate } from 'react-router-dom'
import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@shared/ui'

export interface PlayerHeaderProps {
  courseSlug: string
  courseTitle: string
  lessonTitle: string
  stepIndex: number
  totalSteps: number
}

export function PlayerHeader({
  courseSlug, courseTitle, lessonTitle, stepIndex, totalSteps,
}: PlayerHeaderProps) {
  const navigate = useNavigate()
  const pct = ((stepIndex + 1) / totalSteps) * 100

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="3"
      bg="bg.canvas"
      backdropFilter="saturate(140%) blur(10px)"
    >
      <Container maxW="1100px" px={{ base: '16px', md: '24px' }}>
        {/* Row 1 — exit + breadcrumb + step counter */}
        <Flex h="56px" align="center" gap="16px">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<X size={14} strokeWidth={2.4} />}
            onClick={() => navigate(`/courses/${courseSlug}`)}
          >
            Exit
          </Button>

          <Box flex="1" minW="0" display={{ base: 'none', md: 'block' }}>
            <Flex justify="center" align="center" gap="8px" minW="0">
              <Text
                fontSize="xs"
                color="text.tertiary"
                fontWeight="medium"
                letterSpacing="wide"
                textTransform="uppercase"
                truncate
                maxW="260px"
              >
                {courseTitle}
              </Text>
              <Box w="3px" h="3px" borderRadius="full" bg="border.default" flexShrink={0} />
              <Text
                fontSize="sm"
                color="text.primary"
                fontWeight="semibold"
                lineHeight="none"
                truncate
                maxW="340px"
              >
                {lessonTitle}
              </Text>
            </Flex>
          </Box>

          <Flex
            align="center"
            gap="4px"
            h="28px"
            px="10px"
            borderRadius="full"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.subtle"
            color="text.secondary"
            fontSize="13px"
            fontFamily="mono"
            fontWeight="semibold"
            flexShrink={0}
            lineHeight="none"
            ml={{ base: 'auto', md: 0 }}
          >
            <Box as="span" color="accent.text">{stepIndex + 1}</Box>
            <Box as="span" color="text.tertiary">/</Box>
            <Box as="span">{totalSteps}</Box>
          </Flex>
        </Flex>

        {/* Row 2 — segmented progress */}
        <Box pb="14px" pt="2px">
          <SegmentedProgress pct={pct} current={stepIndex} total={totalSteps} />
        </Box>
      </Container>

      <Box h="1px" bg="border.subtle" opacity={0.6} />
    </Box>
  )
}

function SegmentedProgress({ pct, current, total }: { pct: number; current: number; total: number }) {
  return (
    <Box position="relative" h="14px" display="flex" alignItems="center">
      <Box position="absolute" inset="0" display="flex" alignItems="center">
        <Box w="100%" h="6px" bg="bg.muted" borderRadius="full" overflow="hidden">
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{
              height: '100%',
              background:
                'linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))',
              borderRadius: 9999,
            }}
          />
        </Box>
      </Box>

      <Flex
        position="absolute"
        inset="0"
        align="center"
        justify="space-between"
        pointerEvents="none"
      >
        {Array.from({ length: total }).map((_, i) => {
          const isCompleted = i < current
          const isCurrent = i === current
          const active = isCompleted || isCurrent
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ scale: isCurrent ? 1.2 : 1 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: active
                  ? 'var(--se-colors-accent-solid)'
                  : 'var(--se-colors-bg-surface)',
                border: '2px solid',
                borderColor: active
                  ? 'var(--se-colors-accent-solid)'
                  : 'var(--se-colors-border-default)',
                boxShadow: isCurrent ? '0 0 0 4px rgba(16,185,129,0.20)' : 'none',
                transition: 'background 250ms, border-color 250ms, box-shadow 250ms',
              }}
            />
          )
        })}
      </Flex>
    </Box>
  )
}
