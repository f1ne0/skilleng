import { AuthLayout } from '@widgets/auth-layout'
import { RegisterForm } from '@features/auth-register'

export function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
