import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { SimpleGrid, Stack, Box } from '@chakra-ui/react'
import { User as UserIcon, Mail } from 'lucide-react'
import { Button, Input, showToast, NativeLabel, NativeTextarea } from '@shared/ui'
import { usersApi } from '@shared/api/endpoints/users'
import { extractApiError } from '@shared/api'
import { useAuthStore, type User } from '@entities/user'
import { SectionShell } from './SectionShell'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required.').max(50),
  lastName: z.string().max(50).optional().or(z.literal('')),
  bio: z.string().max(280, 'Keep it under 280 characters.').optional().or(z.literal('')),
})

type Values = z.infer<typeof schema>

export function PersonalInfoSection({ user }: { user: User }) {
  const setUser = useAuthStore((s) => s.setUser)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName ?? '',
      bio: user.bio ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (updated) => {
      setUser(updated)
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName ?? '',
        bio: updated.bio ?? '',
      })
      showToast({ type: 'success', title: 'Profile updated' })
    },
    onError: (err) => setServerError(extractApiError(err)),
  })

  const onSubmit = (v: Values) => {
    setServerError(null)
    mutation.mutate({
      firstName: v.firstName.trim(),
      lastName: v.lastName?.trim() || null,
      bio: v.bio?.trim() || null,
    })
  }

  return (
    <SectionShell
      title="Personal information"
      description="How you appear across SkillEng."
      icon={<UserIcon size={18} />}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => reset()}
            disabled={!isDirty || mutation.isPending}
          >
            Discard
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!isDirty}
            loading={mutation.isPending}
          >
            Save changes
          </Button>
        </>
      }
    >
      <Stack gap="16px">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
          <Input
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            placeholder="Optional"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </SimpleGrid>

        <Input
          label="Email"
          type="email"
          value={user.email}
          disabled
          readOnly
          leftIcon={<Mail size={14} />}
          hint={user.emailVerified ? 'Verified.' : 'Not verified yet — check your inbox.'}
        />

        <Box>
          <NativeLabel
            htmlFor="profile-bio"
            display="block"
            fontSize="sm"
            fontWeight="medium"
            color="text.secondary"
            mb="6px"
          >
            Bio
          </NativeLabel>
          <NativeTextarea
            id="profile-bio"
            placeholder="A line or two about you, your learning goals, anything fun."
            rows={3}
            width="100%"
            p="12px"
            fontSize="md"
            color="text.primary"
            bg="bg.elevated"
            border="1px solid"
            borderColor={errors.bio ? 'error' : 'border.default'}
            borderRadius="lg"
            fontFamily="body"
            lineHeight="relaxed"
            resize="vertical"
            transition="border-color 150ms, box-shadow 150ms"
            _focus={{
              outline: 'none',
              borderColor: errors.bio ? 'error' : 'accent.solid',
              boxShadow: errors.bio ? 'focusError' : 'focus',
            }}
            _placeholder={{ color: 'text.tertiary' }}
            {...register('bio')}
          />
          {errors.bio && (
            <Box fontSize="xs" color="error" mt="6px">
              {errors.bio.message}
            </Box>
          )}
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
      </Stack>
    </SectionShell>
  )
}
