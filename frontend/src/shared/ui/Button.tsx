import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode, CSSProperties } from 'react'
import { Spinner } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import './button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

type NativeButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>

export interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const sizeMap = {
  sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
  md: { height: '40px', padding: '0 16px', fontSize: '14px' },
  lg: { height: '48px', padding: '0 20px', fontSize: '16px' },
} as const

type VariantStyle = {
  base: CSSProperties
  hoverShadow?: string
  data?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
}

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: {
    base: {
      background: 'var(--se-colors-accent-solid)',
      color: '#FFFFFF',
      border: '1px solid transparent',
    },
    data: 'primary',
  },
  secondary: {
    base: {
      background: 'transparent',
      color: 'var(--se-colors-text-primary)',
      border: '1px solid var(--se-colors-border-default)',
    },
    data: 'secondary',
  },
  ghost: {
    base: {
      background: 'transparent',
      color: 'var(--se-colors-text-primary)',
      border: '1px solid transparent',
    },
    data: 'ghost',
  },
  destructive: {
    base: {
      background: 'var(--se-colors-error)',
      color: '#fff',
      border: '1px solid transparent',
    },
    data: 'destructive',
  },
  link: {
    base: {
      background: 'transparent',
      color: 'var(--se-colors-accent-text)',
      border: 'none',
      padding: 0,
      height: 'auto',
    },
    data: 'link',
  },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    disabled,
    children,
    style,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isLink = variant === 'link'
  const sz = sizeMap[size]
  const v = variants[variant]
  const isDisabled = disabled || loading

  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 500,
    lineHeight: 1,
    fontFamily: 'inherit',
    borderRadius: isLink ? 0 : 8,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled && !loading ? 0.4 : 1,
    width: fullWidth ? '100%' : 'auto',
    userSelect: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    transition: 'background 150ms cubic-bezier(0.4,0,0.2,1), border-color 150ms, box-shadow 150ms, color 150ms',
    height: isLink ? 'auto' : sz.height,
    padding: isLink ? 0 : sz.padding,
    fontSize: sz.fontSize,
    ...v.base,
    ...style,
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      data-variant={v.data}
      data-loading={loading ? 'true' : undefined}
      whileHover={isDisabled ? undefined : { y: isLink ? 0 : -1 }}
      whileTap={isDisabled ? undefined : { scale: isLink ? 1 : 0.98 }}
      transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
      style={baseStyle}
      className="se-btn"
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size="xs" borderWidth="2px" />
          <span style={{ opacity: 0.7 }}>{children}</span>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </motion.button>
  )
})
