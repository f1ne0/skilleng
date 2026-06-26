// Оценка силы пароля. Живёт в shared, потому что используется
// и регистрацией (auth-register), и сменой пароля в профиле (user-profile-edit).
export type PasswordStrength = 0 | 1 | 2 | 3 | 4

export function gradePassword(pw: string): PasswordStrength {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4) as PasswordStrength
}

export const strengthLabel: Record<PasswordStrength, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Excellent',
}
