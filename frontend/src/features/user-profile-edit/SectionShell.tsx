import type { ReactNode } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Card } from '@shared/ui'

export interface SectionShellProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function SectionShell({ title, description, icon, children, footer }: SectionShellProps) {
  return (
    <Card padding="spacious">
      <Stack gap="20px">
        <Flex align="flex-start" gap="14px">
          {icon && (
            <Box
              w="36px"
              h="36px"
              borderRadius="md"
              bg="accent.surface"
              color="accent.text"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              {icon}
            </Box>
          )}
          <Box flex="1">
            <Text fontSize="lg" fontWeight="semibold" letterSpacing="tight" lineHeight="tight">
              {title}
            </Text>
            {description && (
              <Text fontSize="sm" color="text.secondary" mt="2px" lineHeight="normal">
                {description}
              </Text>
            )}
          </Box>
        </Flex>

        <Box>{children}</Box>

        {footer && (
          <Flex
            pt="16px"
            borderTop="1px solid"
            borderColor="border.subtle"
            justify="flex-end"
            gap="8px"
          >
            {footer}
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
