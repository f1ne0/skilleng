import { SimpleGrid, Box, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  PenLine,
  MessagesSquare,
  BookOpen,
  Plane,
  Briefcase,
  Target,
  TrendingUp,
  ClipboardList,
  ListChecks,
  GraduationCap,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'
import { NativeButton } from '@shared/ui'
import { useAuthStore } from '@entities/user'
import { staggerContainer, fadeUp } from '@shared/motion'

const STUDENT_PROMPTS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'p1', Icon: PenLine, label: "What's the difference between 'who' and 'whom'?" },
  { id: 'p2', Icon: MessagesSquare, label: 'Help me practice ordering food at a restaurant' },
  { id: 'p3', Icon: BookOpen, label: 'Explain present perfect vs past simple with examples' },
  { id: 'p4', Icon: Plane, label: 'Common English phrases for travel and airports' },
  { id: 'p5', Icon: Briefcase, label: 'How do I write a professional email opener?' },
  { id: 'p6', Icon: Target, label: 'Quiz me on B1-level vocabulary' },
  { id: 'p7', Icon: TrendingUp, label: 'How am I doing? What should I practise next?' },
]

const TEACHER_PROMPTS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 't1', Icon: GraduationCap, label: 'Outline a B1 lesson on the Present Simple' },
  { id: 't2', Icon: ListChecks, label: 'Write 5 multiple-choice questions on past tenses' },
  { id: 't3', Icon: ClipboardList, label: 'Create a checkpoint test for units 1–3' },
  { id: 't4', Icon: PenLine, label: 'Suggest a writing task with a marking rubric' },
  { id: 't5', Icon: Lightbulb, label: 'Give me ideas to teach phrasal verbs' },
  { id: 't6', Icon: BookOpen, label: 'Explain how to grade speaking fairly' },
]

export function SuggestedPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  const isTeacher = useAuthStore((s) => s.user?.role) === 'TEACHER'
  const SUGGESTED_PROMPTS = isTeacher ? TEACHER_PROMPTS : STUDENT_PROMPTS
  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="10px">
        {SUGGESTED_PROMPTS.map((p) => (
          <motion.div key={p.id} variants={fadeUp}>
            <NativeButton
              type="button"
              onClick={() => onPick(p.label)}
              display="flex"
              alignItems="center"
              gap="12px"
              w="100%"
              h="56px"
              px="14px"
              bg="bg.surface"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              textAlign="left"
              cursor="pointer"
              fontFamily="body"
              fontSize="sm"
              fontWeight="medium"
              color="text.primary"
              transition="background 150ms, border-color 150ms, transform 150ms, box-shadow 150ms"
              _hover={{
                bg: 'bg.elevated',
                borderColor: 'border.default',
                transform: 'translateY(-1px)',
              }}
              _active={{ transform: 'translateY(0) scale(0.99)' }}
            >
              <Flex
                w="32px"
                h="32px"
                borderRadius="md"
                bg="accent.surface"
                color="accent.text"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <p.Icon size={15} />
              </Flex>
              <Box flex="1" minW="0">
                <Text truncate>{p.label}</Text>
              </Box>
            </NativeButton>
          </motion.div>
        ))}
      </SimpleGrid>
    </motion.div>
  )
}
