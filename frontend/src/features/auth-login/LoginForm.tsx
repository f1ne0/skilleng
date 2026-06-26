import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button, Input, showToast, Link, NativeButton, NativeInput } from '@shared/ui'
import { authApi } from '@shared/api/endpoints/auth'
import { extractApiError } from '@shared/api'
import { useAuthStore } from '@entities/user'
import { loginSchema, type LoginValues } from './schema'

export function LoginForm() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
    mode: 'onSubmit',
  })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken }, data.user)
      showToast({ type: 'success', title: `Welcome back, ${data.user.firstName}` })
      // учителя — сразу в их раздел, студентов — на дашборд/онбординг
      const home = data.user.role === 'TEACHER'
        ? '/teach'
        : data.user.onboardingCompleted ? '/dashboard' : '/onboarding'
      navigate(home, { replace: true })
    },
    onError: (err) => setServerError(extractApiError(err)),
  })

  const onSubmit = (values: LoginValues) => {
    setServerError(null)
    mutation.mutate({ email: values.email.trim(), password: values.password })
  }

  return (
    <Stack gap="32px">
      <Stack gap="8px">
        <Heading as="h1" fontSize="3xl" fontWeight="semibold" letterSpacing="tight" lineHeight="tight">
          Welcome back
        </Heading>
        <Text fontSize="md" color="text.secondary">
          Sign in to continue your streak.
        </Text>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="20px">
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
              autoComplete="current-password"
              placeholder="••••••••"
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
          </Box>

          <Flex justify="space-between" align="center">
            <Flex as="label" align="center" gap="8px" cursor="pointer" userSelect="none">
              <NativeInput
                type="checkbox"
                {...register('rememberMe')}
                w="16px"
                h="16px"
                accentColor="var(--se-colors-accent-solid)"
              />
              <Text fontSize="sm" color="text.secondary">
                Remember me
              </Text>
            </Flex>
            <Link
              to="/forgot-password"
              fontSize="sm"
              color="accent.text"
              fontWeight="medium"
              textDecoration="none"
              _hover={{ textDecoration: 'underline' }}
            >
              Forgot password?
            </Link>
          </Flex>

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
            Sign in
          </Button>
        </Stack>
      </form>

      <Text fontSize="sm" color="text.secondary" textAlign="center">
        Don't have an account?{' '}
        <Link
          to="/register"
          color="accent.text"
          fontWeight="medium"
          textDecoration="none"
          _hover={{ textDecoration: 'underline' }}
        >
          Sign up
        </Link>
      </Text>
    </Stack>
  )
}
