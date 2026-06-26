import { useState } from 'react'
import { Box, Container, Flex, Stack, Heading, Text, SimpleGrid } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Search, Mail, Lock, Sparkles, Flame, Trophy, Plane, Briefcase,
} from 'lucide-react'
import {
  Button,
  Input,
  Card,
  Badge,
  Skeleton,
  Avatar,
  Dialog,
  showToast,
} from '@shared/ui'
import { ThemeToggle } from '@features/theme-toggle'
import { fadeUp, staggerContainer } from '@shared/motion'

export function PreviewPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [emailError, setEmailError] = useState<string | undefined>()

  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* Header */}
      <Box
        as="header"
        position="sticky"
        top="0"
        zIndex="10"
        bg="bg.canvas"
        borderBottom="1px solid"
        borderColor="border.subtle"
        backdropFilter="blur(8px)"
      >
        <Container maxW="1280px" py="20px">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap="12px">
              <Box
                w="32px"
                h="32px"
                bg="accent.solid"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
              >
                <Sparkles size={18} />
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="semibold" lineHeight="none">
                  SkillEng
                </Text>
                <Text fontSize="xs" color="text.tertiary" mt="2px">
                  Component preview
                </Text>
              </Box>
            </Flex>
            <ThemeToggle />
          </Flex>
        </Container>
      </Box>

      <Container maxW="1280px" py="48px">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          {/* Intro */}
          <motion.div variants={fadeUp}>
            <Stack gap="8px" mb="48px">
              <Heading
                as="h1"
                fontSize="4xl"
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                Design system preview
              </Heading>
              <Text color="text.secondary" maxW="640px">
                Foundation components — Buttons, Inputs, Cards, Badges, Skeletons,
                Avatars, Dialogs, Toasts. Toggle the theme above to verify dark and light modes.
              </Text>
            </Stack>
          </motion.div>

          {/* Buttons */}
          <Section title="Buttons — variants × sizes × states">
            <Stack gap="20px">
              <Row label="Variants (md)">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link button</Button>
              </Row>
              <Row label="Sizes">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Row>
              <Row label="With icons">
                <Button leftIcon={<Sparkles size={14} />}>Get started</Button>
                <Button rightIcon={<ArrowRight size={14} />}>Continue</Button>
                <Button variant="secondary" leftIcon={<Search size={14} />}>
                  Search
                </Button>
              </Row>
              <Row label="States">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button variant="primary" onClick={() => showToast({ type: 'success', title: 'Toast fired', description: 'Top-right placement, auto-dismiss in 4s.' })}>
                  Trigger toast
                </Button>
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  Open dialog
                </Button>
              </Row>
              <Row label="Full width">
                <Box w="320px">
                  <Button fullWidth rightIcon={<ArrowRight size={14} />}>
                    Sign in
                  </Button>
                </Box>
              </Row>
            </Stack>
          </Section>

          {/* Inputs */}
          <Section title="Inputs — label, hint, error, icons">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="24px" maxW="720px">
              <Input
                label="Email"
                type="email"
                placeholder="you@skilleng.com"
                leftIcon={<Mail size={14} />}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                hint="At least 8 characters."
              />
              <Input
                label="Email (with error)"
                type="email"
                defaultValue="not-an-email"
                error="Please enter a valid email address."
                leftIcon={<Mail size={14} />}
              />
              <Input
                label="Disabled"
                placeholder="Cannot edit"
                disabled
                defaultValue="locked@skilleng.com"
              />
              <Input
                label="Large input"
                size="lg"
                placeholder="Search lessons, words, conversations…"
                leftIcon={<Search size={16} />}
              />
              <Box>
                <Input
                  label="Click to trigger shake animation"
                  placeholder="Type then submit invalid"
                  error={emailError}
                />
                <Box mt="8px">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEmailError(undefined)
                      setTimeout(() => setEmailError('Invalid — animated shake.'), 50)
                    }}
                  >
                    Replay shake
                  </Button>
                </Box>
              </Box>
            </SimpleGrid>
          </Section>

          {/* Cards */}
          <Section title="Cards — static, interactive, selected">
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px">
              <Card>
                <Stack gap="6px">
                  <Badge tone="neutral">Static</Badge>
                  <Heading as="h3" fontSize="lg" fontWeight="semibold" mt="6px">
                    Resting card
                  </Heading>
                  <Text fontSize="sm" color="text.secondary">
                    24px padding, subtle border, surface background.
                  </Text>
                </Stack>
              </Card>
              <Card interactive>
                <Stack gap="6px">
                  <Badge tone="accent">Interactive</Badge>
                  <Heading as="h3" fontSize="lg" fontWeight="semibold" mt="6px">
                    Hover me
                  </Heading>
                  <Text fontSize="sm" color="text.secondary">
                    Lifts on hover, scales slightly on press.
                  </Text>
                </Stack>
              </Card>
              <Card interactive selected>
                <Stack gap="6px">
                  <Badge tone="success">Selected</Badge>
                  <Heading as="h3" fontSize="lg" fontWeight="semibold" mt="6px">
                    Active choice
                  </Heading>
                  <Text fontSize="sm" color="text.secondary">
                    Emerald border, ready for onboarding step cards.
                  </Text>
                </Stack>
              </Card>
            </SimpleGrid>
          </Section>

          {/* Onboarding-style card grid */}
          <Section title="Cards in use — onboarding goal grid">
            <SimpleGrid columns={{ base: 2, md: 4 }} gap="16px" maxW="720px">
              {[
                { Icon: Plane,     title: 'Travel',   sub: 'Explore the world' },
                { Icon: Briefcase, title: 'Business', sub: 'Negotiate, present' },
                { Icon: Trophy,    title: 'Exam',     sub: 'IELTS, TOEFL, SAT' },
                { Icon: Flame,     title: 'Daily',    sub: 'Talk, listen, write' },
              ].map(({ Icon, title, sub }, i) => (
                <Card key={title} interactive padding="tight" selected={i === 0}>
                  <Stack gap="10px" align="flex-start">
                    <Box
                      w="36px"
                      h="36px"
                      borderRadius="md"
                      bg="accent.surface"
                      color="accent.text"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon size={18} />
                    </Box>
                    <Box>
                      <Text fontSize="md" fontWeight="semibold">
                        {title}
                      </Text>
                      <Text fontSize="xs" color="text.secondary" mt="2px">
                        {sub}
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Section>

          {/* Badges */}
          <Section title="Badges — tones × shapes">
            <Stack gap="16px">
              <Row label="Tag (md)">
                <Badge tone="neutral">Neutral</Badge>
                <Badge tone="accent">Accent</Badge>
                <Badge tone="success">Success</Badge>
                <Badge tone="warning">Warning</Badge>
                <Badge tone="error">Error</Badge>
                <Badge tone="info">Info</Badge>
              </Row>
              <Row label="Pill">
                <Badge shape="pill" tone="accent" leftIcon={<Flame size={12} />}>
                  7-day streak
                </Badge>
                <Badge shape="pill" tone="success">
                  Active
                </Badge>
                <Badge shape="pill" tone="warning">
                  Beta
                </Badge>
                <Badge shape="pill" tone="info" leftIcon={<Trophy size={12} />}>
                  Level B1
                </Badge>
              </Row>
            </Stack>
          </Section>

          {/* Skeletons */}
          <Section title="Skeletons — shimmer">
            <Card>
              <Flex gap="16px" align="center">
                <Skeleton width="56px" height="56px" radius="full" />
                <Stack gap="8px" flex="1">
                  <Skeleton width="40%" height="14px" />
                  <Skeleton width="70%" height="12px" />
                  <Skeleton width="55%" height="12px" />
                </Stack>
              </Flex>
            </Card>
          </Section>

          {/* Avatars */}
          <Section title="Avatars">
            <Row label="Sizes">
              <Avatar size="xs" name="Azamat Dauletov" />
              <Avatar size="sm" name="Azamat Dauletov" />
              <Avatar size="md" name="Azamat Dauletov" />
              <Avatar size="lg" name="Azamat Dauletov" />
              <Avatar size="xl" name="Azamat Dauletov" />
            </Row>
            <Row label="States">
              <Avatar name="Linear Team" />
              <Avatar name="Stripe Atlas" ring />
              <Avatar name="?" />
            </Row>
          </Section>

          {/* Typography */}
          <Section title="Typography scale">
            <Stack gap="10px">
              <Heading fontSize="5xl" fontWeight="semibold" letterSpacing="tight" lineHeight="tight">
                Display 48px
              </Heading>
              <Heading fontSize="4xl" fontWeight="semibold" letterSpacing="tight" lineHeight="tight">
                Heading 1 — 32px
              </Heading>
              <Heading fontSize="3xl" fontWeight="semibold">Heading 2 — 24px</Heading>
              <Heading fontSize="2xl" fontWeight="semibold">Heading 3 — 20px</Heading>
              <Heading fontSize="xl"  fontWeight="semibold">Heading 4 — 18px</Heading>
              <Text fontSize="lg">Body large — 16px. Used in inputs and emphasised body.</Text>
              <Text fontSize="md">Body default — 14px. The base reading size.</Text>
              <Text fontSize="sm" color="text.secondary">Body small — 13px secondary tone.</Text>
              <Text fontSize="xs" color="text.tertiary">Caption — 12px tertiary tone.</Text>
            </Stack>
          </Section>

          {/* Colors */}
          <Section title="Semantic color tokens">
            <SimpleGrid columns={{ base: 2, md: 5 }} gap="12px">
              {[
                ['bg.canvas',   'Canvas'],
                ['bg.surface',  'Surface'],
                ['bg.elevated', 'Elevated'],
                ['bg.subtle',   'Subtle'],
                ['bg.muted',    'Muted'],
                ['accent.solid', 'Accent solid'],
                ['accent.surface', 'Accent surface'],
                ['success',    'Success'],
                ['warning',    'Warning'],
                ['error',      'Error'],
              ].map(([token, label]) => (
                <Card key={token} padding="tight">
                  <Box
                    h="48px"
                    borderRadius="md"
                    bg={token}
                    border="1px solid"
                    borderColor="border.subtle"
                    mb="8px"
                  />
                  <Text fontSize="xs" fontWeight="medium">{label}</Text>
                  <Text fontSize="xs" color="text.tertiary" fontFamily="mono">{token}</Text>
                </Card>
              ))}
            </SimpleGrid>
          </Section>
        </motion.div>
      </Container>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Welcome to SkillEng"
        description="This is the Dialog component — used for confirmations, focused tasks, and form moments that warrant interruption."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setDialogOpen(false); showToast({ type: 'success', title: 'Confirmed' }) }}>
              Got it
            </Button>
          </>
        }
      >
        <Text fontSize="sm" color="text.secondary">
          Scale-in motion, backdrop blur, keyboard-dismissable, focus-trapped. Try Tab and Esc.
        </Text>
      </Dialog>
    </Box>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section variants={fadeUp} style={{ marginBottom: '64px' }}>
      <Heading
        as="h2"
        fontSize="sm"
        fontWeight="medium"
        color="text.tertiary"
        letterSpacing="wide"
        textTransform="uppercase"
        mb="20px"
      >
        {title}
      </Heading>
      {children}
    </motion.section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize="xs" color="text.tertiary" mb="10px" fontFamily="mono">
        {label}
      </Text>
      <Flex gap="12px" wrap="wrap" align="center">
        {children}
      </Flex>
    </Box>
  )
}
