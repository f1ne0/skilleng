import { Box, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { strengthLabel, type PasswordStrength } from './strength'

const colorMap: Record<PasswordStrength, string> = {
  0: 'var(--se-colors-bg-muted)',
  1: 'var(--se-colors-error)',
  2: 'var(--se-colors-warning)',
  3: 'var(--se-colors-accent-solid)',
  4: 'var(--se-colors-accent-solid)',
}

export function PasswordStrengthMeter({ score }: { score: PasswordStrength }) {
  return (
    <Box mt="8px">
      <Flex gap="4px" mb="6px">
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            flex="1"
            h="3px"
            borderRadius="full"
            bg="bg.muted"
            overflow="hidden"
          >
            <motion.div
              initial={false}
              animate={{
                scaleX: score >= i ? 1 : 0,
                background: score >= i ? colorMap[score] : colorMap[0],
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ height: '100%', width: '100%', transformOrigin: 'left' }}
            />
          </Box>
        ))}
      </Flex>
      <Text fontSize="xs" color="text.tertiary" minH="14px">
        {strengthLabel[score]}
      </Text>
    </Box>
  )
}
