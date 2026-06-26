import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers'
import { router } from './router'
import { Toaster } from '@shared/ui'
import './styles/global.css'

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster />
    </AppProviders>
  )
}
