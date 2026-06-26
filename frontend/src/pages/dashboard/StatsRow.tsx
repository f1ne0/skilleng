import { Box, Flex, Stack, Text, SimpleGrid } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Flame, TrendingUp, Trophy } from 'lucide-react'
import { Card, Badge } from '@shared/ui'
import type { DashboardStats } from './types'

export function StatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap="14px">
      <StreakCard days={stats.streakDays} />
      <XpWeekCard total={stats.xpThisWeek} series={stats.xpDaily} />
      <LevelCard current={stats.currentLevel} next={stats.nextLevel} pct={stats.levelProgressPct} />
    </SimpleGrid>
  )
}

function StatHeader({
  label,
  icon,
  iconColor = 'text.tertiary',
}: {
  label: string
  icon: React.ReactNode
  iconColor?: string
}) {
  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
        {label}
      </Text>
      <Box color={iconColor} display="inline-flex">
        {icon}
      </Box>
    </Flex>
  )
}

function StreakCard({ days }: { days: number }) {
  return (
    <Card padding="comfortable">
      <Stack gap="10px">
        <StatHeader
          label="Streak"
          iconColor="warning"
          icon={
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-flex' }}
            >
              <Flame size={16} fill="currentColor" />
            </motion.span>
          }
        />
        <Flex align="baseline" gap="6px">
          <Text fontSize="4xl" fontWeight="semibold" letterSpacing="tight" lineHeight="none">
            {days}
          </Text>
          <Text fontSize="sm" color="text.tertiary">days</Text>
        </Flex>
        <Text fontSize="xs" color="text.tertiary" lineHeight="normal">
          One lesson keeps it alive.
        </Text>
      </Stack>
    </Card>
  )
}

function XpWeekCard({ total, series }: { total: number; series: { day: string; xp: number }[] }) {
  return (
    <Card padding="comfortable">
      <Stack gap="10px">
        <StatHeader label="XP this week" iconColor="accent.text" icon={<TrendingUp size={16} />} />
        <Flex align="baseline" gap="6px">
          <Text fontSize="4xl" fontWeight="semibold" letterSpacing="tight" lineHeight="none" fontFamily="mono">
            {total.toLocaleString()}
          </Text>
          <Text fontSize="sm" color="text.tertiary">XP</Text>
        </Flex>
        <Sparkline series={series} />
      </Stack>
    </Card>
  )
}

function Sparkline({ series }: { series: { day: string; xp: number }[] }) {
  const W = 240
  const H = 28
  const max = Math.max(...series.map((s) => s.xp), 1)
  const stepX = series.length > 1 ? W / (series.length - 1) : 0

  const points = series.map((s, i) => {
    const x = i * stepX
    const y = H - (s.xp / max) * (H - 4) - 2
    return { x, y }
  })

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  const areaPath = `${path} L ${W} ${H} L 0 ${H} Z`
  const last = points[points.length - 1]

  return (
    <Box mt="2px">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--se-colors-accent-solid)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--se-colors-accent-solid)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#spark-fill)" />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--se-colors-accent-solid)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
        {last && <circle cx={last.x} cy={last.y} r={2.5} fill="var(--se-colors-accent-solid)" />}
      </svg>
    </Box>
  )
}

function LevelCard({ current, next, pct }: { current: string; next: string; pct: number }) {
  return (
    <Card padding="comfortable">
      <Stack gap="10px">
        <StatHeader label="Current level" iconColor="accent.text" icon={<Trophy size={16} />} />
        <Flex align="center" gap="10px">
          <Badge tone="accent" intensity="solid" shape="pill">
            <span style={{ fontSize: 13, fontWeight: 600, padding: '0 4px' }}>{current}</span>
          </Badge>
          <Text fontSize="sm" color="text.secondary">
            {pct}% to {next}
          </Text>
        </Flex>
        <Box>
          <Box h="4px" w="100%" bg="bg.muted" borderRadius="full" overflow="hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
              style={{
                height: '100%',
                background:
                  'linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))',
                borderRadius: 9999,
              }}
            />
          </Box>
        </Box>
      </Stack>
    </Card>
  )
}
