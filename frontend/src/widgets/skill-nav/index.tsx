import { Link } from 'react-router-dom'
import { Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { BookOpen, Headphones, Mic, PenLine, type LucideIcon } from 'lucide-react'
import { Card } from '@shared/ui'

const SKILLS: { to: string; label: string; hint: string; Icon: LucideIcon }[] = [
  { to: '/skills/reading',   label: 'Reading',   hint: 'Texts & comprehension', Icon: BookOpen },
  { to: '/skills/listening', label: 'Listening', hint: 'Audio & dialogues',     Icon: Headphones },
  { to: '/skills/speaking',  label: 'Speaking',  hint: 'Record & get feedback', Icon: Mic },
  { to: '/skills/writing',   label: 'Writing',   hint: 'AI-graded writing',     Icon: PenLine },
]

/** Навигация по четырём видам речевой деятельности (навыковые хабы) */
export function SkillNav() {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap="12px">
      {SKILLS.map(({ to, label, hint, Icon }) => (
        <Link key={to} to={to}>
          <Card padding="comfortable" style={{ height: '100%' }}>
            <Flex align="flex-start" gap="10px">
              <Flex
                w="40px"
                h="40px"
                flexShrink={0}
                align="center"
                justify="center"
                borderRadius="lg"
                bg="accent.subtle"
                color="accent.text"
              >
                <Icon size={20} />
              </Flex>
              <Stack gap="2px" minW="0">
                <Text fontSize="sm" fontWeight="semibold">{label}</Text>
                <Text fontSize="xs" color="text.tertiary" lineHeight="1.3">{hint}</Text>
              </Stack>
            </Flex>
          </Card>
        </Link>
      ))}
    </SimpleGrid>
  )
}
