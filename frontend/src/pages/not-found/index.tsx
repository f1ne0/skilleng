import { useNavigate } from 'react-router-dom'
import { Box, Container, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Compass, ArrowLeft } from 'lucide-react'
import { Button } from '@shared/ui'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Box minH="100vh" bg="bg.canvas" display="flex" alignItems="center">
      <Container maxW="480px" py="64px">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
        <Stack gap="20px" align="center" textAlign="center">
          <Box
            w="64px"
            h="64px"
            borderRadius="full"
            bg="accent.surface"
            color="accent.text"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Compass size={28} />
          </Box>
          <Stack gap="8px">
            <Text fontSize="4xl" fontWeight="semibold" letterSpacing="tight" lineHeight="none">
              404
            </Text>
            <Text fontSize="md" color="text.secondary">
              This page took a turn somewhere. Let's get you back.
            </Text>
          </Stack>
          <Button leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        </Stack>
        </motion.div>
      </Container>
    </Box>
  )
}
