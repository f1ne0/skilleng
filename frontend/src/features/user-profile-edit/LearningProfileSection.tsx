import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Box, Stack, Text } from '@chakra-ui/react'
import { GraduationCap } from 'lucide-react'
import { Button, showToast } from '@shared/ui'
import { usersApi } from '@shared/api/endpoints/users'
import { extractApiError } from '@shared/api'
import {
  useAuthStore,
  StepLevel,
  StepGoal,
  StepLanguage,
  StepInterests,
  type User,
  type CefrLevel,
  type LearningGoal,
} from '@entities/user'
import { SectionShell } from './SectionShell'

interface LocalState {
  level: CefrLevel | null
  goal: LearningGoal | null
  nativeLanguage: string | null
  interests: string[]
}

function takeInitial(user: User): LocalState {
  return {
    level: user.level ?? null,
    goal: user.goal ?? null,
    nativeLanguage: user.nativeLanguage ?? null,
    interests: user.interests ?? [],
  }
}

function isEqual(a: LocalState, b: LocalState): boolean {
  if (a.level !== b.level) return false
  if (a.goal !== b.goal) return false
  if (a.nativeLanguage !== b.nativeLanguage) return false
  if (a.interests.length !== b.interests.length) return false
  const set = new Set(b.interests)
  return a.interests.every((i) => set.has(i))
}

export function LearningProfileSection({ user }: { user: User }) {
  const setUser = useAuthStore((s) => s.setUser)
  const [state, setState] = useState<LocalState>(() => takeInitial(user))
  const [serverError, setServerError] = useState<string | null>(null)

  const initial = useMemo(() => takeInitial(user), [user])
  const dirty = !isEqual(state, initial)

  const mutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (updated) => {
      setUser(updated)
      setState(takeInitial(updated))
      showToast({ type: 'success', title: 'Learning profile updated' })
    },
    onError: (err) => setServerError(extractApiError(err)),
  })

  const onSave = () => {
    setServerError(null)
    mutation.mutate({
      ...(state.level !== initial.level ? { level: state.level ?? undefined } : {}),
      ...(state.goal !== initial.goal ? { goal: state.goal ?? undefined } : {}),
      ...(state.nativeLanguage !== initial.nativeLanguage
        ? { nativeLanguage: state.nativeLanguage }
        : {}),
      ...(!isEqual({ ...initial, interests: state.interests }, initial)
        ? { interests: state.interests }
        : {}),
    })
  }

  return (
    <SectionShell
      title="Learning profile"
      description="The model behind your lessons. Tweak whenever your goals shift."
      icon={<GraduationCap size={18} />}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => setState(initial)}
            disabled={!dirty || mutation.isPending}
          >
            Discard
          </Button>
          <Button onClick={onSave} disabled={!dirty} loading={mutation.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <Stack gap="32px">
        <SubBlock label="English level">
          <StepLevel
            value={state.level}
            onChange={(level) => setState((s) => ({ ...s, level }))}
          />
        </SubBlock>

        <SubBlock label="Learning goal">
          <StepGoal
            value={state.goal}
            onChange={(goal) => setState((s) => ({ ...s, goal }))}
          />
        </SubBlock>

        <SubBlock label="Native language">
          <StepLanguage
            value={state.nativeLanguage}
            onChange={(code) => setState((s) => ({ ...s, nativeLanguage: code }))}
          />
        </SubBlock>

        <SubBlock label="Interests">
          <StepInterests
            value={state.interests}
            onChange={(interests) => setState((s) => ({ ...s, interests }))}
          />
        </SubBlock>

        {serverError && (
          <Box
            p="12px 14px"
            borderRadius="lg"
            bg="rgba(244,63,94,0.08)"
            border="1px solid rgba(244,63,94,0.25)"
            color="error"
            fontSize="sm"
          >
            {serverError}
          </Box>
        )}
      </Stack>
    </SectionShell>
  )
}

function SubBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="medium"
        color="text.tertiary"
        letterSpacing="wide"
        textTransform="uppercase"
        mb="12px"
      >
        {label}
      </Text>
      {children}
    </Box>
  )
}
