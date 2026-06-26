import { Box, Container, Flex } from '@chakra-ui/react'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@shared/ui'
import type { StepStatus } from '../types'

export interface PlayerFooterProps {
  /** Whether the current step is a checkable exercise (vs. theory/review which auto-advance). */
  checkable: boolean
  /** Status of the check. */
  status: StepStatus
  /** Whether user can submit (e.g. answer chosen / typed). */
  canCheck: boolean
  /** Whether this is the last step in the lesson. */
  isLast: boolean
  onCheck: () => void
  onContinue: () => void
  /** Ждём AI-оценку речи/письма — кнопка «Continue/Finish» заблокирована. */
  waitingAi?: boolean
}

export function PlayerFooter({
  checkable, status, canCheck, isLast, onCheck, onContinue, waitingAi,
}: PlayerFooterProps) {
  const checked = status === 'correct' || status === 'wrong'

  let label: string
  let icon: React.ReactNode
  let handler: () => void
  let disabled = false

  if (!checkable) {
    label = isLast ? 'Finish lesson' : 'Continue'
    icon = isLast ? <Check size={16} /> : <ArrowRight size={16} />
    handler = onContinue
  } else if (!checked) {
    label = 'Check'
    icon = <Check size={16} />
    handler = onCheck
    disabled = !canCheck
  } else if (waitingAi) {
    label = 'Waiting for feedback…'
    icon = <ArrowRight size={16} />
    handler = onContinue
    disabled = true
  } else {
    label = isLast ? 'Finish lesson' : 'Continue'
    icon = isLast ? <Check size={16} /> : <ArrowRight size={16} />
    handler = onContinue
  }

  return (
    <Box
      position="sticky"
      bottom="0"
      bg="bg.canvas"
      borderTop="1px solid"
      borderColor="border.subtle"
      zIndex="2"
    >
      <Container maxW="720px" py="16px" px={{ base: '16px', md: '24px' }}>
        <Flex justify="flex-end">
          <Button
            size="lg"
            onClick={handler}
            disabled={disabled}
            rightIcon={icon}
            variant={status === 'wrong' && checked ? 'secondary' : 'primary'}
          >
            {label}
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}
