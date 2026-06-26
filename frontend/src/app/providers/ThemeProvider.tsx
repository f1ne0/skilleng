import type { ReactNode } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { ThemeProvider as NextThemes } from 'next-themes'
import { system } from '@shared/config/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </NextThemes>
  )
}
