import { useNavigate } from 'react-router-dom'
import { Box, Container, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@shared/ui'

export function ForbiddenPage() {
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
            bg="rgba(244,63,94,0.10)"
            color="error"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <ShieldAlert size={28} />
          </Box>
          <Stack gap="8px">
            <Text fontSize="4xl" fontWeight="semibold" letterSpacing="tight" lineHeight="none">
              403
            </Text>
            <Text fontSize="md" color="text.secondary">
              You don't have access to this area. If you think that's a mistake, contact support.
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
