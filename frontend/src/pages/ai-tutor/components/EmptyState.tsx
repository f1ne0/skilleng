import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useAuthStore } from '@entities/user'
import { SuggestedPrompts } from './SuggestedPrompts'

export function EmptyState({ onPickPrompt }: { onPickPrompt: (prompt: string) => void }) {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.firstName ?? 'friend'
  const isTeacher = user?.role === 'TEACHER'
  const subtitle = isTeacher
    ? 'I can draft lessons, write exercises and exams, build rubrics, or brainstorm how to teach a tricky point.'
    : 'I can explain grammar, drill you on tricky points, fix your writing, or just have a conversation.'

  return (
    <Flex h="100%" align="center" justify="center" px="20px" py="40px">
      <Stack gap="32px" maxW="640px" w="100%">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <Stack gap="16px" align="center" textAlign="center">
            <Box
              w="56px"
              h="56px"
              borderRadius="full"
              bg="accent.solid"
              color="text.onAccent"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 0 6px var(--se-colors-accent-surface), 0 12px 32px rgba(16,185,129,0.30)"
            >
              <Bot size={26} />
            </Box>
            <Stack gap="6px" align="center">
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                How can I help, {firstName}?
              </Text>
              <Text fontSize="md" color="text.secondary" lineHeight="relaxed">
                {subtitle}
              </Text>
            </Stack>
          </Stack>
        </motion.div>

        <SuggestedPrompts onPick={onPickPrompt} />
      </Stack>
    </Flex>
  )
}
