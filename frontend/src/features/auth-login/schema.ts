import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().optional(),
})

export type LoginValues = z.infer<typeof loginSchema>
