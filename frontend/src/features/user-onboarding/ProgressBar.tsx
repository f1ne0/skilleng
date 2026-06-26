import { Box, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100
  return (
    <Box>
      <Flex justify="space-between" mb="10px">
        <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
          Step {step + 1} of {total}
        </Text>
        <Text fontSize="xs" color="accent.text" fontWeight="medium">
          {Math.round(pct)}%
        </Text>
      </Flex>
      <Box h="4px" w="100%" bg="bg.muted" borderRadius="full" overflow="hidden">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background:
              'linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))',
            borderRadius: 9999,
          }}
        />
      </Box>
    </Box>
  )
}
