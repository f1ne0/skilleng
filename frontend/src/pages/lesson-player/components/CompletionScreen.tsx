import { useNavigate } from 'react-router-dom'
import { Box, Container, Flex, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Star, Zap } from 'lucide-react'
import { Button, Card } from '@shared/ui'

export interface CompletionScreenProps {
  courseSlug: string
  lessonTitle: string
  correctCount: number
  totalExercises: number
  xpEarned: number
}

export function CompletionScreen({
  courseSlug, lessonTitle, correctCount, totalExercises, xpEarned,
}: CompletionScreenProps) {
  const navigate = useNavigate()
  const accuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 100

  return (
    <Container maxW="640px" py="64px" px={{ base: '20px', md: '32px' }}>
      <Stack gap="32px" align="center" textAlign="center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.05 }}
        >
          <Box
            w="80px" h="80px"
            borderRadius="full"
            bg="accent.solid"
            color="white"
            display="flex" alignItems="center" justifyContent="center"
            boxShadow="0 0 0 8px var(--se-colors-accent-surface), 0 16px 40px rgba(16,185,129,0.40)"
          >
            <Sparkles size={32} />
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          <Stack gap="8px">
            <Text
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="semibold"
              letterSpacing="tight"
              lineHeight="tight"
            >
              Lesson complete
            </Text>
            <Text fontSize="md" color="text.secondary">
              {lessonTitle} — locked in.
            </Text>
          </Stack>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          style={{ width: '100%' }}
        >
          <Card padding="comfortable">
            <Flex gap="16px" justify="space-around" align="center" wrap="wrap">
              <Stat
                icon={<Zap size={16} fill="currentColor" />}
                tone="accent.text"
                value={`+${xpEarned}`}
                label="XP earned"
              />
              <Box w="1px" h="40px" bg="border.subtle" />
              <Stat
                icon={<Star size={16} fill="currentColor" />}
                tone="warning"
                value={`${accuracy}%`}
                label="Accuracy"
              />
              <Box w="1px" h="40px" bg="border.subtle" />
              <Stat
                icon={<Sparkles size={16} />}
                tone="accent.text"
                value={`${correctCount}/${totalExercises}`}
                label="Correct"
              />
            </Flex>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.42 }}
          style={{ width: '100%' }}
        >
          <Stack gap="10px" w="100%">
            <Button
              size="lg"
              fullWidth
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate(`/courses/${courseSlug}`)}
            >
              Back to course
            </Button>
            <Button
              size="md"
              variant="ghost"
              fullWidth
              onClick={() => navigate('/dashboard')}
            >
              Return to dashboard
            </Button>
          </Stack>
        </motion.div>
      </Stack>
    </Container>
  )
}

function Stat({
  icon, tone, value, label,
}: {
  icon: React.ReactNode
  tone: string
  value: string
  label: string
}) {
  return (
    <Stack gap="4px" align="center" minW="80px">
      <Flex align="center" gap="6px" color={tone}>
        {icon}
        <Text
          fontSize="xl"
          fontWeight="semibold"
          letterSpacing="tight"
          lineHeight="none"
          fontFamily="mono"
          color="text.primary"
        >
          {value}
        </Text>
      </Flex>
      <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
        {label}
      </Text>
    </Stack>
  )
}
