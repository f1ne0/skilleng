import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { Box, Stack } from '@chakra-ui/react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Button, Input, showToast, NativeButton, gradePassword, PasswordStrengthMeter } from '@shared/ui'
import { usersApi } from '@shared/api/endpoints/users'
import { extractApiError } from '@shared/api'
import { SectionShell } from './SectionShell'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z.string().min(8, 'Use at least 8 characters.').max(72),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must differ from the current one.',
    path: ['newPassword'],
  })

type Values = z.infer<typeof schema>

export function PasswordSection() {
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPw = watch('newPassword') ?? ''
  const strength = gradePassword(newPw)

  const mutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      reset()
      showToast({ type: 'success', title: 'Password updated' })
    },
    onError: (err) => setServerError(extractApiError(err)),
  })

  const onSubmit = (v: Values) => {
    setServerError(null)
    mutation.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword })
  }

  const eyeToggle = (
    <NativeButton
      type="button"
      aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
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
  )

  return (
    <SectionShell
      title="Password"
      description="Use a long, unique passphrase. We'll never email it to you."
      icon={<Lock size={18} />}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => reset()}
            disabled={!isDirty || mutation.isPending}
          >
            Discard
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={!isDirty} loading={mutation.isPending}>
            Update password
          </Button>
        </>
      }
    >
      <Stack gap="14px" maxW="480px">
        <Input
          label="Current password"
          type={showPw ? 'text' : 'password'}
          autoComplete="current-password"
          leftIcon={<Lock size={14} />}
          rightIcon={eyeToggle}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Box>
          <Input
            label="New password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            leftIcon={<Lock size={14} />}
            rightIcon={eyeToggle}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordStrengthMeter score={strength} />
        </Box>
        <Input
          label="Confirm new password"
          type={showPw ? 'text' : 'password'}
          autoComplete="new-password"
          leftIcon={<Lock size={14} />}
          rightIcon={eyeToggle}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

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
