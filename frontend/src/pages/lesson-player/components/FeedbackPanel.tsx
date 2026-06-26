import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react'

export interface FeedbackPanelProps {
  status: 'correct' | 'wrong' | 'hidden'
  correctAnswer?: string
  explanation?: string
  /** Speaking/writing answer sent for AI review — show a neutral "submitted" state. */
  aiPending?: boolean
}

export function FeedbackPanel({ status, correctAnswer, explanation, aiPending }: FeedbackPanelProps) {
  const visible = status !== 'hidden'
  const correct = status === 'correct'
  const pending = Boolean(aiPending)

  const bg = pending
    ? 'rgba(59,130,246,0.10)'
    : correct
      ? 'rgba(16,185,129,0.10)'
      : 'rgba(244,63,94,0.08)'
  const borderColor = pending
    ? 'rgba(59,130,246,0.40)'
    : correct
      ? 'rgba(16,185,129,0.40)'
      : 'rgba(244,63,94,0.35)'
  const iconColor = pending ? '#3B82F6' : correct ? 'accent.solid' : 'error'
  const headline = pending
    ? 'Submitted for review.'
    : correct
      ? "Nice — that's right."
      : 'Not quite.'

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 4, height: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <Box
            mt="20px"
            p="16px 18px"
            bg={bg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
          >
            <Flex align="flex-start" gap="12px">
              <Box color={iconColor} mt="2px" flexShrink={0}>
                {pending ? <Sparkles size={18} /> : correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              </Box>
              <Stack gap="6px" flex="1" minW="0">
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color={pending ? '#3B82F6' : correct ? 'accent.text' : 'error'}
                >
                  {headline}
                </Text>
                {pending && (
                  <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
                    {explanation ?? 'Your answer was recorded. Content, grammar and fluency are reviewed by AI — you can move on.'}
                  </Text>
                )}
                {!pending && !correct && correctAnswer && (
                  <Text fontSize="sm" color="text.secondary">
                    Correct answer:{' '}
                    <Text as="span" fontWeight="semibold" color="text.primary">
                      {correctAnswer}
                    </Text>
                  </Text>
                )}
                {!pending && explanation && (
                  <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
                    {explanation}
                  </Text>
                )}
              </Stack>
            </Flex>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
