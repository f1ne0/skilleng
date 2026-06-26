import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, Ref } from 'react'
import { chakra } from '@chakra-ui/react'
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom'

/** Chakra-styled native elements that preserve their HTML props. */
export const Anchor = chakra('a')
export const NativeButton = chakra('button')
export const NativeInput = chakra('input')
export const NativeLabel = chakra('label')
export const NativeTextarea = chakra('textarea')

const ChakraRouterLink = chakra(RouterLink)

type ChakraRouterLinkProps = ComponentPropsWithoutRef<typeof ChakraRouterLink>

export const Link = forwardRef(function Link(
  props: ChakraRouterLinkProps & RouterLinkProps,
  ref: Ref<HTMLAnchorElement>,
) {
  return <ChakraRouterLink ref={ref} {...props} />
})
