import type { ReactNode } from 'react'
import { Box, Flex, Stack, Heading, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { AUTH_GRADIENT } from '@shared/config/theme'
import { fadeUp } from '@shared/motion'
import { XpDemo } from './XpDemo'

export interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Flex minH="100vh" bg="bg.canvas">
      {/* Left — form pane */}
      <Box
        flex="1"
        minW={{ base: '100%', md: '480px' }}
        position="relative"
      >
        {/* Brand */}
        <Box position="absolute" top="32px" left="32px" zIndex="2">
          <Flex align="center" gap="10px">
            <Box
              w="28px"
              h="28px"
              bg="accent.solid"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
            >
              <Sparkles size={16} />
            </Box>
            <Text fontSize="md" fontWeight="semibold" letterSpacing="tight">
              SkillEng
            </Text>
          </Flex>
        </Box>

        <Flex
          minH="100vh"
          align="center"
          justify="center"
          px={{ base: '24px', md: '48px' }}
          py={{ base: '96px', md: '64px' }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            style={{ width: '100%', maxWidth: 400 }}
          >
            {children}
          </motion.div>
        </Flex>
      </Box>

      {/* Right — marketing pane (hidden on mobile) */}
      <Box
        flex="1"
        display={{ base: 'none', lg: 'block' }}
        position="relative"
        overflow="hidden"
        borderLeft="1px solid"
        borderColor="border.subtle"
        bg="bg.surface"
      >
        {/* Gradient mesh */}
        <Box
          position="absolute"
          inset="0"
          backgroundImage={AUTH_GRADIENT}
          pointerEvents="none"
        />

        <Flex
          position="relative"
          h="100vh"
          direction="column"
          justify="space-between"
          p="64px"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Stack gap="16px" maxW="520px">
              <Heading
                as="h2"
                fontSize="4xl"
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                Learn English the way it should be.
              </Heading>
              <Text fontSize="lg" color="text.secondary" lineHeight="relaxed">
                Personalised lessons, an AI tutor that actually listens, and a
                streak that's worth keeping. Built for serious learners.
              </Text>
            </Stack>
          </motion.div>

          <Box flex="1" position="relative" my="32px">
            <XpDemo />
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Flex gap="32px" color="text.tertiary" fontSize="xs">
              <Text>Trusted by learners in 40+ countries</Text>
              <Text>·</Text>
              <Text>Aligned with CEFR A1–C2</Text>
            </Flex>
          </motion.div>
        </Flex>
      </Box>
    </Flex>
  )
}
