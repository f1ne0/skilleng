import { z } from 'zod'

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required.')
      .max(50, 'First name is too long.'),
    lastName: z.string().max(50, 'Last name is too long.').optional().or(z.literal('')),
    email: z.string().min(1, 'Email is required.').email('Please enter a valid email.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(72, 'Password is too long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the Terms to continue.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export type RegisterValues = z.infer<typeof registerSchema>

// gradePassword/strengthLabel/PasswordStrength переехали в @shared/ui/password
// (используются и сменой пароля в профиле — фича из фичи в FSD запрещено)
