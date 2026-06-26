import { useState } from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Download, Users } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { analyticsApi, groupsApi, extractApiError } from '@shared/api'
import type { SkillType } from '@shared/model'
import { Avatar, Button, Card, NativeButton, Skeleton, showToast } from '@shared/ui'

const SKILLS: SkillType[] = ['READING', 'LISTENING', 'SPEAKING', 'WRITING']
const SKILL_SHORT: Record<SkillType, string> = {
  READING: 'Read',
  LISTENING: 'Listen',
  SPEAKING: 'Speak',
  WRITING: 'Write',
}

// Цвет индикатора по правильности 0..1: точка насыщенная, фон полупрозрачный
function heatTone(value: number | null): { dot: string; bg: string } {
  if (value === null)
    return { dot: 'var(--se-colors-text-tertiary)', bg: 'transparent' }
  if (value >= 0.85) return { dot: '#22c55e', bg: 'rgba(34,197,94,0.10)' }
  if (value >= 0.7) return { dot: '#4ade80', bg: 'rgba(34,197,94,0.07)' }
  if (value >= 0.5) return { dot: '#eab308', bg: 'rgba(234,179,8,0.10)' }
  if (value >= 0.3) return { dot: '#f97316', bg: 'rgba(249,115,22,0.10)' }
  return { dot: '#ef4444', bg: 'rgba(239,68,68,0.10)' }
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value * 100)}%`
}

// Сетка строки heatmap: студент + xp + уроки + 5 метрик
const HEAT_GRID = 'minmax(190px, 1.6fr) 64px 72px repeat(5, minmax(84px, 1fr))'

export function TeachAnalyticsPage() {
  const [groupId, setGroupId] = useState<string | null>(null)

  const groupsQuery = useQuery({
    queryKey: ['groups', 'my', 'teach-analytics'],
    queryFn: groupsApi.my,
  })
  const owned = groupsQuery.data?.owned ?? []
  const selectedId = groupId ?? owned[0]?.id ?? null

  const analyticsQuery = useQuery({
    queryKey: ['analytics', 'group', selectedId],
    queryFn: () => analyticsApi.group(selectedId!),
    enabled: Boolean(selectedId),
  })

  const exportMutation = useMutation({
    mutationFn: () =>
      analyticsApi.exportGroupCsv(
        selectedId!,
        analyticsQuery.data?.group.name ?? 'group',
      ),
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const data = analyticsQuery.data

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1280px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Stack gap="6px" mb="24px">
          <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
            Analytics
          </Heading>
          <Text fontSize="md" color="text.secondary">
            Group performance by skill, weekly trend, and CSV export.
          </Text>
        </Stack>

        {/* выбор группы + экспорт в одну строку */}
        <Flex justify="space-between" align="center" gap="12px" wrap="wrap" mb="20px">
          <Flex gap="8px" wrap="wrap">
          {groupsQuery.isLoading && <Skeleton h="34px" w="220px" borderRadius="full" />}
          {owned.map((g) => (
            <NativeButton
              key={g.id}
              onClick={() => setGroupId(g.id)}
              px="12px"
              py="6px"
              borderRadius="full"
              border="1px solid"
              borderColor={selectedId === g.id ? 'accent.solid' : 'border.default'}
              bg={selectedId === g.id ? 'accent.subtle' : 'transparent'}
              color={selectedId === g.id ? 'accent.text' : 'text.secondary'}
              fontSize="sm"
            >
              {g.name}
            </NativeButton>
          ))}
          {!groupsQuery.isLoading && owned.length === 0 && (
            <Card padding="comfortable">
              <Flex align="center" gap="10px">
                <Users size={18} />
                <Text fontSize="sm" color="text.secondary">
                  You don't own any groups yet — create one to collect experiment data.
                </Text>
              </Flex>
            </Card>
          )}
          </Flex>
          {selectedId && (
            <Button
              size="sm"
              loading={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              <Download size={14} /> Export CSV
            </Button>
          )}
        </Flex>

        {selectedId && (
          <>
            {analyticsQuery.isLoading && <Skeleton h="320px" borderRadius="lg" />}
            {analyticsQuery.error != null && (
              <Card padding="comfortable">
                <Text fontSize="sm" color="text.secondary">
                  {extractApiError(analyticsQuery.error)}
                </Text>
              </Card>
            )}

            {data && (
              <Stack gap="20px">
                {/* средние по группе */}
                <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px">
                  <StatCard label="Avg accuracy" value={pct(data.averages.accuracy)} />
                  <StatCard
                    label="Avg XP"
                    value={data.averages.totalXp !== null ? String(Math.round(data.averages.totalXp)) : '—'}
                  />
                  <StatCard
                    label="Avg lessons done"
                    value={
                      data.averages.lessonsCompleted !== null
                        ? String(Math.round(data.averages.lessonsCompleted * 10) / 10)
                        : '—'
                    }
                  />
                  <StatCard label="Students" value={String(data.students.length)} />
                </SimpleGrid>

                {data.trend.length > 1 && <TrendCard trend={data.trend} />}

                {/* тепловая карта студенты × навыки */}
                <Card padding="comfortable">
                  <Flex justify="space-between" align="center" mb="14px" wrap="wrap" gap="8px">
                    <Text fontSize="sm" fontWeight="semibold">
                      Accuracy by skill
                    </Text>
                    <Flex gap="12px" align="center" wrap="wrap">
                      <Legend color={heatTone(0.9).dot} label="85%+" />
                      <Legend color={heatTone(0.75).dot} label="70+" />
                      <Legend color={heatTone(0.6).dot} label="50+" />
                      <Legend color={heatTone(0.4).dot} label="30+" />
                      <Legend color={heatTone(0.1).dot} label="<30" />
                    </Flex>
                  </Flex>

                  {data.students.length === 0 ? (
                    <Text fontSize="sm" color="text.secondary">No students in this group yet.</Text>
                  ) : (
                    <Box overflowX="auto" mx="-8px">
                      <Box minW="860px" px="8px">
                        {/* шапка */}
                        <Box
                          display="grid"
                          gridTemplateColumns={HEAT_GRID}
                          gap="10px"
                          px="12px"
                          pb="8px"
                        >
                          <HeaderCell>Student</HeaderCell>
                          <HeaderCell align="center">XP</HeaderCell>
                          <HeaderCell align="center">Lessons</HeaderCell>
                          <HeaderCell align="center">Overall</HeaderCell>
                          {SKILLS.map((s) => (
                            <HeaderCell key={s} align="center">{SKILL_SHORT[s]}</HeaderCell>
                          ))}
                        </Box>

                        {/* строки */}
                        <Stack gap="4px" maxH="56vh" overflowY="auto">
                          {data.students.map((s) => (
                            <Box
                              key={s.id}
                              display="grid"
                              gridTemplateColumns={HEAT_GRID}
                              gap="10px"
                              alignItems="center"
                              px="12px"
                              py="10px"
                              borderRadius="lg"
                              transition="background 120ms"
                              _hover={{ bg: 'bg.subtle' }}
                            >
                              <Flex align="center" gap="10px" minW="0">
                                <Avatar
                                  size="sm"
                                  name={`${s.firstName}${s.lastName ? ` ${s.lastName}` : ''}`}
                                />
                                <Box minW="0">
                                  <Text fontSize="sm" fontWeight="medium" truncate>
                                    {s.firstName}{s.lastName ? ` ${s.lastName}` : ''}
                                  </Text>
                                  <Text fontSize="xs" color="text.tertiary">
                                    {s.level ?? 'no level'}
                                    {s.currentStreak >= 3 ? ` · ${s.currentStreak}-day streak` : ''}
                                  </Text>
                                </Box>
                              </Flex>
                              <Text fontSize="sm" color="text.secondary" textAlign="center" fontVariantNumeric="tabular-nums">
                                {s.totalXp}
                              </Text>
                              <Text fontSize="sm" color="text.secondary" textAlign="center" fontVariantNumeric="tabular-nums">
                                {s.lessonsCompleted}
                              </Text>
                              <HeatPill value={s.answered > 0 ? s.accuracy : null} strong />
                              {SKILLS.map((skill) => (
                                <HeatPill key={skill} value={s.skillBreakdown[skill]} />
                              ))}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </Card>
              </Stack>
            )}
          </>
        )}
      </Container>
    </Box>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="comfortable">
      <Stack gap="2px">
        <Text fontSize="xs" color="text.tertiary" textTransform="uppercase" letterSpacing="wide">
          {label}
        </Text>
        <Text fontSize="2xl" fontWeight="semibold">{value}</Text>
      </Stack>
    </Card>
  )
}

function HeaderCell({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <Text
      fontSize="xs"
      color="text.tertiary"
      textTransform="uppercase"
      letterSpacing="wide"
      fontWeight="medium"
      textAlign={align}
    >
      {children}
    </Text>
  )
}

/** Метрика навыка: число + тонкий цветной прогресс-бар под ним */
function HeatPill({ value, strong }: { value: number | null; strong?: boolean }) {
  const tone = heatTone(value)

  if (value === null) {
    return (
      <Flex direction="column" align="center" gap="5px" justifySelf="center" minW="52px">
        <Text fontSize="sm" color="text.tertiary">—</Text>
        <Box w="40px" h="3px" borderRadius="full" bg="bg.muted" />
      </Flex>
    )
  }

  return (
    <Flex direction="column" align="center" gap="5px" justifySelf="center" minW="52px">
      <Text
        fontSize="sm"
        fontWeight={strong ? 'semibold' : 'medium'}
        color="text.primary"
        fontVariantNumeric="tabular-nums"
        lineHeight="none"
      >
        {pct(value)}
      </Text>
      <Box w="40px" h="3px" borderRadius="full" bg="bg.muted" overflow="hidden">
        <Box
          h="100%"
          w={`${Math.max(4, Math.round(value * 100))}%`}
          bg={tone.dot}
          borderRadius="full"
          transition="width 0.4s"
        />
      </Box>
    </Flex>
  )
}

function TrendCard({ trend }: { trend: Array<{ weekStart: string; accuracy: number }> }) {
  const max = Math.max(0.01, ...trend.map((t) => t.accuracy))
  return (
    <Card padding="comfortable">
      <Text fontSize="sm" fontWeight="semibold" mb="14px">Accuracy trend (by week)</Text>
      <Flex align="flex-end" justify="space-between" gap="8px" h="140px">
        {trend.map((t) => (
          <Stack key={t.weekStart} gap="6px" flex="1" align="center" justify="flex-end" h="100%">
            <Text fontSize="xs" color="text.tertiary" fontVariantNumeric="tabular-nums">
              {Math.round(t.accuracy * 100)}%
            </Text>
            <Box w="100%" maxW="40px" h={`${Math.max(4, Math.round((t.accuracy / max) * 96))}px`}
              bg="accent.solid" borderRadius="sm" />
            <Text fontSize="xs" color="text.tertiary">{t.weekStart.slice(5)}</Text>
          </Stack>
        ))}
      </Flex>
    </Card>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Flex align="center" gap="5px">
      <Box w="7px" h="7px" borderRadius="full" bg={color} />
      <Text fontSize="xs" color="text.tertiary">{label}</Text>
    </Flex>
  )
}
