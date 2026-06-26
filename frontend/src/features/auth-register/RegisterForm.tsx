import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react'
import { Button, Input, showToast, Link, NativeButton, NativeInput, Anchor } from '@shared/ui'
import { authApi } from '@shared/api/endpoints/auth'
import { extractApiError } from '@shared/api'
import { useAuthStore } from '@entities/user'
import { gradePassword, PasswordStrengthMeter } from '@shared/ui'
import { registerSchema, type RegisterValues } from './schema'

export function RegisterForm() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onSubmit',
  })

  const password = watch('password') ?? ''
  const strength = gradePassword(password)

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken }, data.user)
      showToast({
        type: 'success',
        title: 'Account created',
        description: "Let's set up your learning profile.",
      })
      navigate('/onboarding', { replace: true })
    },
    onError: (err) => setServerError(extractApiError(err)),
  })

  const onSubmit = (values: RegisterValues) => {
    setServerError(null)
    mutation.mutate({
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim(),
      lastName: values.lastName?.trim() || undefined,
    })
  }

  return (
    <Stack gap="28px">
      <Stack gap="8px">
        <Heading as="h1" fontSize="3xl" fontWeight="semibold" letterSpacing="tight" lineHeight="tight">
          Create your account
        </Heading>
        <Text fontSize="md" color="text.secondary">
          Start your English journey in under a minute.
        </Text>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="18px">
          <SimpleGrid columns={2} gap="12px">
            <Input
              label="First name"
              autoComplete="given-name"
              placeholder="Azamat"
              leftIcon={<UserIcon size={14} />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name (optional)"
              autoComplete="family-name"
              placeholder="Dauletov"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </SimpleGrid>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@skilleng.com"
            leftIcon={<Mail size={14} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Box>
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              leftIcon={<Lock size={14} />}
              rightIcon={
                <NativeButton
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw((v) => !v)}
                  display="flex"
                  alignItems="center"
                  bg="transparent"
                  border="none"
                  cursor="pointer"
                  color="text.tertiary"
                  _hover={{ color: 'text.primary' }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </NativeButton>
              }
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordStrengthMeter score={strength} />
          </Box>

          <Input
            label="Confirm password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            leftIcon={<Lock size={14} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Box>
            <Flex as="label" align="flex-start" gap="10px" cursor="pointer" userSelect="none">
              <NativeInput
                type="checkbox"
                {...register('acceptTerms')}
                w="16px"
                h="16px"
                mt="2px"
                accentColor="var(--se-colors-accent-solid)"
                flexShrink={0}
              />
              <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
                I agree to the{' '}
                <Anchor href="/terms" color="accent.text" _hover={{ textDecoration: 'underline' }}>
                  Terms of Service
                </Anchor>{' '}
                and{' '}
                <Anchor href="/privacy" color="accent.text" _hover={{ textDecoration: 'underline' }}>
                  Privacy Policy
                </Anchor>
                .
              </Text>
            </Flex>
            {errors.acceptTerms && (
              <Text fontSize="xs" color="error" mt="6px">
                {errors.acceptTerms.message}
              </Text>
            )}
          </Box>

          {serverError && isSubmitted && (
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

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={mutation.isPending}
            rightIcon={!mutation.isPending ? <ArrowRight size={16} /> : null}
          >
            Create account
          </Button>
        </Stack>
      </form>

      <Text fontSize="sm" color="text.secondary" textAlign="center">
        Already have an account?{' '}
        <Link
          to="/login"
          color="accent.text"
          fontWeight="medium"
          textDecoration="none"
          _hover={{ textDecoration: 'underline' }}
        >
          Sign in
        </Link>
      </Text>
    </Stack>
  )
}
