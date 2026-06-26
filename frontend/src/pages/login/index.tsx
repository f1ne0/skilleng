import { AuthLayout } from '@widgets/auth-layout'
import { LoginForm } from '@features/auth-login'

export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
