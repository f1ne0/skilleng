import type { Variants, Transition } from 'framer-motion'

const easeStandard = [0.4, 0, 0.2, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeStandard } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: easeStandard } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easeStandard } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easeStandard } },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

export const shake: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.3 },
  },
}

export const toastSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}
