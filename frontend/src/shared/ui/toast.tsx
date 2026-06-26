import {
  createToaster,
  Toaster as ChakraToaster,
  Toast,
  Portal,
  Stack,
  IconButton,
  Box,
} from '@chakra-ui/react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import type { ReactNode } from 'react'

export const toaster = createToaster({
  placement: 'top-end',
  overlap: false,
  max: 3,
  gap: 12,
})

type ToastType = 'success' | 'error' | 'warning' | 'info'

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} color="var(--se-colors-success)" />,
  error:   <AlertCircle size={18} color="var(--se-colors-error)" />,
  warning: <AlertTriangle size={18} color="var(--se-colors-warning)" />,
  info:    <Info size={18} color="var(--se-colors-info)" />,
}

const borderColorMap: Record<ToastType, string> = {
  success: 'var(--se-colors-success)',
  error:   'var(--se-colors-error)',
  warning: 'var(--se-colors-warning)',
  info:    'var(--se-colors-info)',
}

export function showToast(opts: {
  type?: ToastType
  title: string
  description?: string
  duration?: number
}) {
  const type = opts.type ?? 'info'
  toaster.create({
    type,
    title: opts.title,
    description: opts.description,
    duration: opts.duration ?? 4000,
    meta: { iconType: type },
  })
}

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '16px' }}>
        {(t) => {
          const type = (t.type as ToastType | undefined) ?? 'info'
          return (
            <Toast.Root
              key={t.id}
              bg="bg.elevated"
              border="1px solid"
              borderColor="border.default"
              borderRadius="lg"
              boxShadow="lg"
              minW="320px"
              maxW="420px"
              p="14px 16px"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                bg: borderColorMap[type],
                borderTopLeftRadius: 'lg',
                borderBottomLeftRadius: 'lg',
              }}
            >
              <Stack direction="row" gap="12px" align="flex-start">
                <Box pt="2px">{iconMap[type]}</Box>
                <Stack gap="2px" flex="1">
                  {t.title && (
                    <Toast.Title fontSize="sm" fontWeight="semibold" color="text.primary">
                      {t.title}
                    </Toast.Title>
                  )}
                  {t.description && (
                    <Toast.Description fontSize="sm" color="text.secondary">
                      {t.description}
                    </Toast.Description>
                  )}
                </Stack>
                <Toast.CloseTrigger asChild>
                  <IconButton
                    aria-label="Dismiss"
                    variant="ghost"
                    size="xs"
                    color="text.tertiary"
                    _hover={{ bg: 'bg.subtle', color: 'text.primary' }}
                  >
                    <X size={14} />
                  </IconButton>
                </Toast.CloseTrigger>
              </Stack>
            </Toast.Root>
          )
        }}
      </ChakraToaster>
    </Portal>
  )
}
