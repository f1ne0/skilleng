import { Box, Container, Stack } from '@chakra-ui/react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@shared/motion'
import { useAuthStore } from '@entities/user'
import {
  ProfileHeader,
  PersonalInfoSection,
  LearningProfileSection,
  PasswordSection,
} from '@features/user-profile-edit'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />

  const isTeacher = user.role === 'TEACHER'

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="960px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <Stack gap="20px">
            <motion.div variants={fadeUp}>
              <ProfileHeader user={user} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <PersonalInfoSection user={user} />
            </motion.div>
            {!isTeacher && (
              <motion.div variants={fadeUp}>
                <LearningProfileSection user={user} />
              </motion.div>
            )}
            <motion.div variants={fadeUp}>
              <PasswordSection />
            </motion.div>
          </Stack>
        </motion.div>
        <Box h="48px" />
      </Container>
    </Box>
  )
}
