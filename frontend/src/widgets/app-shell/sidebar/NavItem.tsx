import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export interface NavItemProps {
  to: string
  label: string
  Icon: LucideIcon
  collapsed: boolean
  endSlot?: ReactNode
  /** Точное совпадение пути (для корневых пунктов вроде /teach,
   *  иначе NavLink подсвечивает их на всех вложенных роутах) */
  exact?: boolean
}

/**
 * Layout note: the icon lives in a fixed-width 40px column anchored to the
 * left of the row. Its horizontal position never changes during collapse —
 * only the label appears/disappears beside it.
 *
 *   sidebar px=12   nav-item
 *   ┌──────┐ ┌──────────────────────────────┐
 *   │  ←12 │ │ [icon 40] [label flex-1]     │
 *   └──────┘ └──────────────────────────────┘
 *
 * Result: icon center == sidebar center when collapsed (64 / 2 = 32), and
 * sits at x=32 when expanded too — no jump.
 */
export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(function NavItem(
  { to, label, Icon, collapsed, endSlot, exact },
  ref,
) {
  return (
    <NavLink
      ref={ref}
      to={to}
      end={exact}
      title={collapsed ? label : undefined}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      {({ isActive }) => (
        <Box
          position="relative"
          display="flex"
          alignItems="center"
          h="40px"
          borderRadius="lg"
          color={isActive ? 'accent.text' : 'text.secondary'}
          fontSize="sm"
          fontWeight="medium"
          cursor="pointer"
          transition="color 150ms cubic-bezier(0.4,0,0.2,1)"
          _hover={isActive ? undefined : { bg: 'bg.subtle', color: 'text.primary' }}
        >
          {/* Активная "пилюля" с общим layoutId — плавно ПЕРЕТЕКАЕТ
              между пунктами меню при переходах */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-pill"
              transition={{ type: 'spring', stiffness: 480, damping: 40 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 10,
                background: 'var(--se-colors-accent-surface)',
              }}
            >
              <Box
                position="absolute"
                left="-12px"
                top="8px"
                bottom="8px"
                w="2px"
                borderRadius="full"
                bg="accent.solid"
              />
            </motion.div>
          )}

          {/* Fixed-width icon column — anchors icon at a stable X */}
          <Flex
            w="40px"
            h="40px"
            align="center"
            justify="center"
            flexShrink={0}
            position="relative"
            zIndex={1}
          >
            <motion.div
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              style={{ display: 'flex' }}
            >
              <Icon size={18} />
            </motion.div>
          </Flex>

          {/* Label + endSlot — fade/slide in only when sidebar is expanded */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingRight: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Box flex="1" overflow="hidden" textOverflow="ellipsis">
                  {label}
                </Box>
                {endSlot}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      )}
    </NavLink>
  )
})
