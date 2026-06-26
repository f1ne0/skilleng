import type { ReactNode } from 'react'
import {
  Dialog as ChakraDialog,
  Portal,
  Box,
  Flex,
  IconButton,
} from '@chakra-ui/react'
import { X } from 'lucide-react'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widthMap = { sm: '420px', md: '560px', lg: '720px' } as const

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  return (
    <ChakraDialog.Root
      open={open}
      onOpenChange={(d) => onOpenChange(d.open)}
      placement="center"
      motionPreset="scale"
    >
      <Portal>
        <ChakraDialog.Backdrop
          bg="rgba(0,0,0,0.6)"
          backdropFilter="blur(4px)"
        />
        <ChakraDialog.Positioner>
          <ChakraDialog.Content
            bg="bg.elevated"
            border="1px solid"
            borderColor="border.default"
            borderRadius="xl"
            boxShadow="xl"
            maxW={widthMap[size]}
            w="100%"
            color="text.primary"
          >
            {(title || description) && (
              <Box px="24px" pt="24px" pb={children ? '16px' : '24px'}>
                {title && (
                  <ChakraDialog.Title fontSize="xl" fontWeight="semibold" lineHeight="tight">
                    {title}
                  </ChakraDialog.Title>
                )}
                {description && (
                  <ChakraDialog.Description fontSize="sm" color="text.secondary" mt="6px">
                    {description}
                  </ChakraDialog.Description>
                )}
              </Box>
            )}

            {children && (
              <Box px="24px" py="8px">
                {children}
              </Box>
            )}

            {footer && (
              <Flex
                px="24px"
                py="20px"
                borderTop="1px solid"
                borderColor="border.subtle"
                gap="8px"
                justifyContent="flex-end"
              >
                {footer}
              </Flex>
            )}

            <ChakraDialog.CloseTrigger
              asChild
              position="absolute"
              top="12px"
              right="12px"
            >
              <IconButton
                aria-label="Close dialog"
                variant="ghost"
                size="sm"
                color="text.tertiary"
                _hover={{ bg: 'bg.subtle', color: 'text.primary' }}
              >
                <X size={16} />
              </IconButton>
            </ChakraDialog.CloseTrigger>
          </ChakraDialog.Content>
        </ChakraDialog.Positioner>
      </Portal>
    </ChakraDialog.Root>
  )
}
