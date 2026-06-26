import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Box, Flex, chakra } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { shake } from '@shared/motion'

const ChakraInput = chakra('input')
const ChakraLabel = chakra('label')

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  size?: 'md' | 'lg'
  containerProps?: { mb?: string | number }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightIcon, size = 'md', id, containerProps, ...rest },
  ref,
) {
  const reactId = useId()
  const inputId = id ?? reactId
  const hasError = Boolean(error)
  const h = size === 'lg' ? '48px' : '40px'

  return (
    <Box w="100%" mb={containerProps?.mb}>
      {label && (
        <ChakraLabel
          htmlFor={inputId}
          display="block"
          fontSize="sm"
          fontWeight="medium"
          color="text.secondary"
          mb="6px"
        >
          {label}
        </ChakraLabel>
      )}

      <motion.div variants={shake} animate={hasError ? 'shake' : 'idle'}>
        <Flex
          position="relative"
          alignItems="center"
          h={h}
          bg="bg.elevated"
          borderRadius="lg"
          border="1px solid"
          borderColor={hasError ? 'error' : 'border.default'}
          transition="border-color 150ms, box-shadow 150ms"
          _hover={hasError ? undefined : { borderColor: 'border.strong' }}
          _focusWithin={{
            borderColor: hasError ? 'error' : 'accent.solid',
            boxShadow: hasError ? 'focusError' : 'focus',
          }}
        >
          {leftIcon && (
            <Box pl="12px" color="text.tertiary" display="flex" alignItems="center">
              {leftIcon}
            </Box>
          )}
          <ChakraInput
            ref={ref}
            id={inputId}
            aria-invalid={hasError || undefined}
            aria-describedby={hint || error ? `${inputId}-hint` : undefined}
            flex="1"
            h="100%"
            minW="0"
            bg="transparent"
            border="none"
            outline="none"
            borderRadius="lg"
            px={leftIcon ? '8px' : '12px'}
            fontSize="md"
            color="text.primary"
            fontFamily="body"
            _placeholder={{ color: 'text.tertiary' }}
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
            css={{
              // убираем нативные стрелки у type="number"
              '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '&[type=number]': { MozAppearance: 'textfield' },
            }}
            {...(rest as Record<string, unknown>)}
          />
          {rightIcon && (
            <Box pr="12px" color="text.tertiary" display="flex" alignItems="center">
              {rightIcon}
            </Box>
          )}
        </Flex>
      </motion.div>

      {(error || hint) && (
        <Flex
          id={`${inputId}-hint`}
          mt="6px"
          fontSize="xs"
          color={hasError ? 'error' : 'text.tertiary'}
          alignItems="center"
          gap="4px"
        >
          {hasError && <AlertCircle size={12} aria-hidden />}
          <span>{error || hint}</span>
        </Flex>
      )}
    </Box>
  )
})
