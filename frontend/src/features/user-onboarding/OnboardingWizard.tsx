import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Box, Container, Flex, Heading, Stack, Text,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button, NativeButton, showToast } from '@shared/ui'
import {
  useAuthStore,
  type CefrLevel,
  type LearningGoal,
  // шаги и данные учебного профиля живут в @entities/user (переиспользуются
  // редактированием профиля)
  StepLevel,
  StepGoal,
  StepLanguage,
  StepInterests,
  INITIAL_ONBOARDING_STATE,
  STEP_TITLES,
  STEP_SUBTITLES,
  MIN_INTERESTS,
  type OnboardingState,
  type StepIndex,
} from '@entities/user'
import { onboardingApi } from '@shared/api/endpoints/onboarding'
import { extractApiError } from '@shared/api'
import { ProgressBar } from './ProgressBar'

const TOTAL_STEPS = 4

export function OnboardingWizard() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const [step, setStep] = useState<StepIndex>(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [state, setState] = useState<OnboardingState>({
    ...INITIAL_ONBOARDING_STATE,
    // если уровень уже определён входным тестом — префиллим
    level: user?.level ?? INITIAL_ONBOARDING_STATE.level,
  })
  const [serverError, setServerError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: onboardingApi.submit,
    onSuccess: (updated) => {
      setUser(updated)
      showToast({
        type: 'success',
        title: `You're all set, ${updated.firstName}`,
        description: "Let's start your first lesson.",
      })
      navigate('/dashboard', { replace: true })
    },
    onError: (err) => setServerError(extractApiError(err)),
  })

  const canAdvance = (() => {
    switch (step) {
      case 0: return state.level !== null
      case 1: return state.goal !== null
      case 2: return state.nativeLanguage !== null
      case 3: return state.interests.length >= MIN_INTERESTS
    }
  })()

  const handleNext = () => {
    if (!canAdvance) return
    if (step < TOTAL_STEPS - 1) {
      setDirection(1)
      setStep((s) => (s + 1) as StepIndex)
      return
    }
    if (!state.level || !state.goal) return
    setServerError(null)
    mutation.mutate({
      level: state.level,
      goal: state.goal,
      nativeLanguage: state.nativeLanguage ?? undefined,
      interests: state.interests.length > 0 ? state.interests : undefined,
    })
  }

  const handleBack = () => {
    if (step === 0) return
    setDirection(-1)
    setStep((s) => (s - 1) as StepIndex)
  }

  const isLast = step === TOTAL_STEPS - 1

  return (
    <Box minH="100vh" bg="bg.canvas" position="relative">
      {/* Brand top-left */}
      <Box position="absolute" top="32px" left="32px">
        <Flex align="center" gap="10px">
          <Box
            w="28px"
            h="28px"
            bg="accent.solid"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
          >
            <Sparkles size={16} />
          </Box>
          <Text fontSize="md" fontWeight="semibold" letterSpacing="tight">
            SkillEng
          </Text>
        </Flex>
      </Box>

      <Container
        maxW="640px"
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py="96px"
        px="24px"
      >
        <Box w="100%">
          <Stack gap="40px">
            <ProgressBar step={step} total={TOTAL_STEPS} />

            {/* Heading — static anchor; only inner text cross-fades */}
            <Stack gap="6px" minH="76px">
              <Heading
                as="h1"
                fontSize="3xl"
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`title-${step}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{ display: 'inline-block' }}
                  >
                    {STEP_TITLES[step]}
                  </motion.span>
                </AnimatePresence>
              </Heading>
              <Text fontSize="md" color="text.secondary">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`sub-${step}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{ display: 'inline-block' }}
                  >
                    {STEP_SUBTITLES[step]}
                  </motion.span>
                </AnimatePresence>
              </Text>
            </Stack>

            {/* Steps */}
            <Box position="relative" overflowX="hidden" overflowY="visible" mx="-8px" px="8px" pt="4px">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                >
                  {step === 0 && (
                    <Stack gap="16px">
                      <StepLevel
                        value={state.level}
                        onChange={(level: CefrLevel) => setState((s) => ({ ...s, level }))}
                      />
                      {/* Не уверен в уровне → адаптивный входной тест (Блок 3) */}
                      <Text fontSize="sm" color="text.tertiary" textAlign="center">
                        Not sure?{' '}
                        <NativeButton
                          onClick={() => navigate('/placement')}
                          color="accent.text"
                          fontWeight="medium"
                          textDecoration="underline"
                          fontSize="sm"
                          display="inline"
                          p="0"
                        >
                          Take a 10-minute placement test
                        </NativeButton>{' '}
                        — we'll detect it for you.
                      </Text>
                    </Stack>
                  )}
                  {step === 1 && (
                    <StepGoal
                      value={state.goal}
                      onChange={(goal: LearningGoal) => setState((s) => ({ ...s, goal }))}
                    />
                  )}
                  {step === 2 && (
                    <StepLanguage
                      value={state.nativeLanguage}
                      onChange={(code) => setState((s) => ({ ...s, nativeLanguage: code }))}
                    />
                  )}
                  {step === 3 && (
                    <StepInterests
                      value={state.interests}
                      onChange={(interests) => setState((s) => ({ ...s, interests }))}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </Box>

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

            {/* Nav */}
            <Flex justify="space-between" align="center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0 || mutation.isPending}
                leftIcon={<ArrowLeft size={14} />}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canAdvance || mutation.isPending}
                loading={mutation.isPending}
                rightIcon={!mutation.isPending ? <ArrowRight size={14} /> : null}
              >
                {isLast ? 'Get started' : 'Continue'}
              </Button>
            </Flex>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
