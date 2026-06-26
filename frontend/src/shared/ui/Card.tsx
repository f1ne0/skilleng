import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import './card.css'

export type CardPadding = 'tight' | 'comfortable' | 'spacious'
export type CardVariant = 'subtle' | 'flush' | 'hero'

type NativeDivProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>

export interface CardProps extends NativeDivProps {
  interactive?: boolean
  padding?: CardPadding
  selected?: boolean
  variant?: CardVariant
  children?: ReactNode
}

const padMap = { tight: '16px', comfortable: '24px', spacious: '32px' } as const

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    interactive = false,
    padding = 'comfortable',
    selected = false,
    variant = 'subtle',
    children,
    style,
    className,
    ...rest
  },
  ref,
) {
  const baseStyle: CSSProperties = {
    borderRadius: variant === 'hero' ? 16 : 12,
    padding: padMap[padding],
    cursor: interactive ? 'pointer' : 'default',
    position: 'relative',
    transition:
      'border-color 200ms cubic-bezier(0.4,0,0.2,1), background 200ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms cubic-bezier(0.4,0,0.2,1)',
    ...style,
  }

  // When selected we override visuals to accent tint regardless of variant
  if (selected) {
    baseStyle.background = 'var(--se-colors-accent-surface)'
    baseStyle.border = '1px solid var(--se-colors-border-accent)'
  }

  return (
    <motion.div
      ref={ref}
      whileHover={interactive && !selected ? { y: -1 } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      data-variant={variant}
      data-interactive={interactive ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      className={['se-card', className].filter(Boolean).join(' ')}
      style={baseStyle}
      {...rest}
    >
      {children}
    </motion.div>
  )
})
