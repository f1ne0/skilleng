import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
  ClipboardCheck,
  BarChart3,
  Library,
  AlertTriangle,
  Trophy,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, Badge, Button, Card, Skeleton } from '@shared/ui'
import { analyticsApi, coursesApi, examsApi, groupsApi } from '@shared/api'
import type { ExamSummary, GroupStudentRow } from '@shared/api'
import type { SkillType } from '@shared/model'
import { useAuthStore } from '@entities/user'
import { staggerContainer, fadeUp } from '@shared/motion'

const SKILLS: { key: SkillType; label: string }[] = [
  { key: 'READING', label: 'Reading' },
  { key: 'LISTENING', label: 'Listening' },
  { key: 'SPEAKING', label: 'Speaking' },
  { key: 'WRITING', label: 'Writing' },
]

function greet(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still here'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function barColor(v: number): string {
  if (v >= 0.8) return '#22c55e'
  if (v >= 0.6) return '#4ade80'
  if (v >= 0.45) return '#eab308'
  return '#ef4444'
}

export function TeachDashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const coursesQuery = useQuery({ queryKey: ['courses', 'my'], queryFn: coursesApi.my })
  const groupsQuery = useQuery({ queryKey: ['groups', 'my'], queryFn: groupsApi.my })

  const ownedCourses = coursesQuery.data ?? []
  const ownedGroups = groupsQuery.data?.owned ?? []
  const groupIds = ownedGroups.map((g) => g.id)
  const courseIds = ownedCourses.map((c) => c.id)

  const analyticsQuery = useQuery({
    queryKey: ['teach-overview', groupIds],
    queryFn: async () => {
      const groups = await Promise.all(groupIds.map((id) => analyticsApi.group(id)))
      const students = groups.flatMap((g) => g.students)
      const withData = students.filter((s) => s.answered > 0)
      const avgAccuracy =
        withData.length > 0
          ? Math.round((withData.reduce((s, x) => s + x.accuracy, 0) / withData.length) * 100)
          : null
      const classSkills: Record<SkillType, number | null> = {
        READING: null, LISTENING: null, SPEAKING: null, WRITING: null,
      }
      for (const sk of SKILLS) {
        const vals = students.map((s) => s.skillBreakdown[sk.key]).filter((v): v is number => v != null)
        classSkills[sk.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      }
      // сводка по каждой группе — для сравнения между группами
      const groupSummaries = groups.map((g) => ({
        id: g.group.id,
        name: g.group.name,
        students: g.students.length,
        accuracy: g.averages.accuracy,
        lessons: g.averages.lessonsCompleted,
      }))
      return { students, avgAccuracy, classSkills, groupSummaries }
    },
    enabled: groupIds.length > 0,
  })

  const examsQuery = useQuery({
    queryKey: ['teach-overview-exams', courseIds],
    queryFn: async () => {
      const lists = await Promise.all(
        ownedCourses.map(async (c) => {
          const exams = await examsApi.listForCourse(c.id)
          return exams.map((e) => ({ ...e, courseTitle: c.title }))
        }),
      )
      return lists.flat()
    },
    enabled: courseIds.length > 0,
  })

  const loadingShell = coursesQuery.isLoading || groupsQuery.isLoading
  const totalStudents = ownedGroups.reduce((s, g) => s + (g._count?.memberships ?? 0), 0)

  const studentsRanked = [...(analyticsQuery.data?.students ?? [])].filter((s) => s.answered >= 3)
  const needsAttention = studentsRanked
    .filter((s) => s.accuracy < 0.5)
    .sort((a, b) => a.accuracy - b.accuracy)
  const topStudent = [...studentsRanked].sort((a, b) => b.accuracy - a.accuracy)[0]
  const examsToSetup = (examsQuery.data ?? []).filter((e) => e.questionCount === 0)

  // Пустой аккаунт (нет курсов и групп) — экран первых шагов
  const isEmptyAccount = !loadingShell && ownedCourses.length === 0 && ownedGroups.length === 0

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1100px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Stack gap="6px" mb="28px">
              <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold"
                letterSpacing="tight" lineHeight="tight">
                {greet()}, {user?.firstName ?? 'teacher'}
              </Heading>
              <Text fontSize="md" color="text.secondary">
                Your teaching workspace — courses, exams and student performance.
              </Text>
            </Stack>
          </motion.div>

          {isEmptyAccount ? (
            <GettingStarted
              onCourse={() => navigate('/teach/courses/new')}
              onGroup={() => navigate('/teach/groups/new')}
            />
          ) : (
            <>
              {/* 1. KPI — состояния, требующие действия */}
              <motion.div variants={fadeUp}>
                <SimpleGrid columns={{ base: 2, md: 4 }} gap="14px" mb="28px">
                  <Kpi label="Students" value={`${totalStudents}`} hint="across all groups" />
                  <Kpi
                    label="Avg accuracy"
                    value={analyticsQuery.isLoading ? '…'
                      : analyticsQuery.data?.avgAccuracy != null ? `${analyticsQuery.data.avgAccuracy}%` : '—'}
                    hint="all students"
                  />
                  <Kpi
                    label="Need help"
                    value={`${needsAttention.length}`}
                    hint="students below 50%"
                    tone={needsAttention.length > 0 ? 'error' : undefined}
                    onClick={needsAttention.length > 0 ? () => navigate('/teach/analytics') : undefined}
                  />
                  <Kpi
                    label="Exams to set up"
                    value={`${examsToSetup.length}`}
                    hint="no questions yet"
                    tone={examsToSetup.length > 0 ? 'warning' : undefined}
                    onClick={examsToSetup.length > 0 ? () => navigate('/teach/exams') : undefined}
                  />
                </SimpleGrid>
              </motion.div>

              {/* 2. Зона внимания: люди + навыки класса */}
              {groupIds.length > 0 && (
                <motion.div variants={fadeUp}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px" mb="20px">
                    <Card padding="comfortable">
                      <Flex align="center" gap="8px" mb="12px">
                        <Box color="warning"><AlertTriangle size={16} /></Box>
                        <Text fontSize="md" fontWeight="semibold">Needs attention</Text>
                      </Flex>
                      {analyticsQuery.isLoading ? (
                        <Stack gap="6px">
                          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h="40px" borderRadius="md" />)}
                        </Stack>
                      ) : needsAttention.length === 0 ? (
                        <Text fontSize="sm" color="text.secondary" py="8px">
                          Everyone is above 50% — nice work.
                        </Text>
                      ) : (
                        <Stack gap="2px">
                          {needsAttention.slice(0, 4).map((s) => (
                            <PersonRow key={s.id} student={s} tone="error"
                              onOpen={() => navigate('/teach/analytics')} />
                          ))}
                        </Stack>
                      )}
                      {topStudent && (
                        <>
                          <Flex align="center" gap="8px" mt="16px" mb="8px">
                            <Box color="accent.text"><Trophy size={15} /></Box>
                            <Text fontSize="sm" fontWeight="semibold" color="text.secondary">Top performer</Text>
                          </Flex>
                          <PersonRow student={topStudent} tone="success"
                            onOpen={() => navigate('/teach/analytics')} />
                        </>
                      )}
                    </Card>

                    <Card padding="comfortable">
                      <Flex align="center" justify="space-between" mb="14px">
                        <Text fontSize="md" fontWeight="semibold">Class skills</Text>
                        <Button size="sm" variant="ghost" onClick={() => navigate('/teach/analytics')}>
                          Details
                        </Button>
                      </Flex>
                      {analyticsQuery.isLoading ? (
                        <Stack gap="12px">
                          {SKILLS.map((s) => <Skeleton key={s.key} h="28px" borderRadius="md" />)}
                        </Stack>
                      ) : (
                        <Stack gap="12px">
                          {SKILLS.map((s) => {
                            const v = analyticsQuery.data?.classSkills[s.key] ?? null
                            return (
                              <Stack key={s.key} gap="5px">
                                <Flex justify="space-between">
                                  <Text fontSize="sm" color="text.secondary">{s.label}</Text>
                                  <Text fontSize="sm" fontWeight="medium" fontVariantNumeric="tabular-nums">
                                    {v == null ? '—' : `${Math.round(v * 100)}%`}
                                  </Text>
                                </Flex>
                                <Box h="6px" bg="bg.muted" borderRadius="full" overflow="hidden">
                                  {v != null && (
                                    <Box h="100%" w={`${Math.round(v * 100)}%`} borderRadius="full"
                                      bg={barColor(v)} transition="width 0.5s" />
                                  )}
                                </Box>
                              </Stack>
                            )
                          })}
                        </Stack>
                      )}
                    </Card>
                  </SimpleGrid>
                </motion.div>
              )}

              {/* Сравнение групп между собой */}
              {(analyticsQuery.data?.groupSummaries.length ?? 0) > 1 && (
                <motion.div variants={fadeUp}>
                  <Card padding="comfortable" style={{ marginBottom: 20 }}>
                    <Flex align="center" justify="space-between" mb="14px">
                      <Flex align="center" gap="8px">
                        <Box color="accent.text"><Users size={16} /></Box>
                        <Text fontSize="md" fontWeight="semibold">Groups at a glance</Text>
                      </Flex>
                      <Button size="sm" variant="ghost" onClick={() => navigate('/teach/analytics')}>
                        Compare
                      </Button>
                    </Flex>
                    <Stack gap="14px">
                      {analyticsQuery.data!.groupSummaries.map((g) => {
                        const acc = g.accuracy ?? 0
                        return (
                          <Stack key={g.id} gap="6px">
                            <Flex justify="space-between" align="center" wrap="wrap" gap="6px">
                              <Text fontSize="sm" fontWeight="medium">{g.name}</Text>
                              <Flex gap="12px" align="center">
                                <Text fontSize="xs" color="text.tertiary">{g.students} students</Text>
                                <Text fontSize="xs" color="text.tertiary">
                                  {g.lessons != null ? `${Math.round(g.lessons)} avg lessons` : '—'}
                                </Text>
                                <Text fontSize="sm" fontWeight="medium" fontVariantNumeric="tabular-nums" minW="42px" textAlign="right">
                                  {g.accuracy != null ? `${Math.round(acc * 100)}%` : '—'}
                                </Text>
                              </Flex>
                            </Flex>
                            <Box h="6px" bg="bg.muted" borderRadius="full" overflow="hidden">
                              {g.accuracy != null && (
                                <Box h="100%" w={`${Math.round(acc * 100)}%`} borderRadius="full"
                                  bg={barColor(acc)} transition="width 0.5s" />
                              )}
                            </Box>
                          </Stack>
                        )
                      })}
                    </Stack>
                  </Card>
                </motion.div>
              )}

              {/* 3. Экзамены к настройке */}
              {examsToSetup.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Card padding="comfortable" style={{ marginBottom: 20 }}>
                    <Flex align="center" justify="space-between" mb="12px">
                      <Flex align="center" gap="8px">
                        <Box color="accent.text"><ClipboardCheck size={16} /></Box>
                        <Text fontSize="md" fontWeight="semibold">Exams to set up</Text>
                      </Flex>
                      <Button size="sm" variant="ghost" onClick={() => navigate('/teach/exams')}>Set up</Button>
                    </Flex>
                    <Stack gap="2px">
                      {examsToSetup.slice(0, 5).map((e: ExamSummary & { courseTitle: string }) => (
                        <Flex key={e.id} align="center" justify="space-between" gap="10px" p="8px 10px"
                          borderRadius="md" _hover={{ bg: 'bg.subtle' }} role="button" cursor="pointer"
                          onClick={() => navigate('/teach/exams')}>
                          <Stack gap="0" minW="0">
                            <Text fontSize="sm" fontWeight="medium" truncate>{e.title}</Text>
                            <Text fontSize="xs" color="text.tertiary">{e.courseTitle}</Text>
                          </Stack>
                          <Badge tone="warning" shape="pill">no questions</Badge>
                        </Flex>
                      ))}
                    </Stack>
                  </Card>
                </motion.div>
              )}

              {/* 4. Быстрые действия */}
              <motion.div variants={fadeUp}>
                <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px" mb="28px">
                  <QuickAction icon={Sparkles} label="AI Generator" hint="Create questions"
                    onClick={() => navigate('/teach/content-generator')} />
                  <QuickAction icon={ClipboardCheck} label="Exams" hint="Checkpoints & finals"
                    onClick={() => navigate('/teach/exams')} />
                  <QuickAction icon={BarChart3} label="Analytics" hint="Heatmap & export"
                    onClick={() => navigate('/teach/analytics')} />
                  <QuickAction icon={Library} label="Topics" hint="Theory library"
                    onClick={() => navigate('/teach/topics')} />
                </SimpleGrid>
              </motion.div>

              {/* 5. Администрирование */}
              <motion.div variants={fadeUp}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
                  <Section
                    title="Courses" count={`${ownedCourses.length}`}
                    icon={<BookOpen size={16} />}
                    onAllClick={() => navigate('/teach/courses')}
                    onCreate={() => navigate('/teach/courses/new')}
                    isLoading={coursesQuery.isLoading}
                    emptyText="No courses yet — create your first one."
                    items={ownedCourses.slice(0, 4).map((c) => ({
                      id: c.id, title: c.title,
                      subtitle: c.category.replaceAll('_', ' ').toLowerCase(),
                      status: c.status,
                      onOpen: () => navigate(`/teach/courses/${c.id}/edit`),
                    }))}
                  />
                  <Section
                    title="Groups" count={`${ownedGroups.length}`}
                    icon={<Users size={16} />}
                    onAllClick={() => navigate('/teach/groups')}
                    onCreate={() => navigate('/teach/groups/new')}
                    isLoading={groupsQuery.isLoading}
                    emptyText="No groups yet — create one to invite students."
                    items={ownedGroups.slice(0, 4).map((g) => ({
                      id: g.id, title: g.name,
                      subtitle: `${g._count?.memberships ?? 0} members`,
                      status: null,
                      onOpen: () => navigate(`/teach/groups/${g.id}`),
                    }))}
                  />
                </SimpleGrid>
              </motion.div>
            </>
          )}

          <Box h="40px" />
        </motion.div>
      </Container>
    </Box>
  )
}

function GettingStarted({ onCourse, onGroup }: { onCourse: () => void; onGroup: () => void }) {
  return (
    <motion.div variants={fadeUp}>
      <Card padding="spacious">
        <Stack align="center" textAlign="center" gap="14px" py="28px">
          <Box w="56px" h="56px" borderRadius="xl" bg="accent.subtle" color="accent.text"
            display="flex" alignItems="center" justifyContent="center">
            <GraduationCap size={26} />
          </Box>
          <Stack gap="6px" maxW="460px">
            <Heading as="h2" fontSize="xl" fontWeight="semibold">Let's set up your teaching space</Heading>
            <Text fontSize="sm" color="text.secondary">
              Create a course to add lessons and exams, and a group to invite your students.
              Once students join, this page shows their performance and what needs your attention.
            </Text>
          </Stack>
          <Flex gap="10px" mt="6px" wrap="wrap" justify="center">
            <Button onClick={onCourse}><Plus size={15} /> Create course</Button>
            <Button variant="secondary" onClick={onGroup}><Plus size={15} /> Create group</Button>
          </Flex>
        </Stack>
      </Card>
    </motion.div>
  )
}

function Kpi({ label, value, hint, tone, onClick }: {
  label: string; value: string; hint: string
  tone?: 'error' | 'warning'; onClick?: () => void
}) {
  const accent = tone === 'error' ? 'error' : tone === 'warning' ? 'warning' : 'text.primary'
  return (
    <Card padding="comfortable"
      style={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}
      onClick={onClick}>
      <Stack gap="4px">
        <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">{label}</Text>
        <Text fontSize="3xl" fontWeight="semibold" lineHeight="none" color={accent}>{value}</Text>
        <Text fontSize="xs" color="text.tertiary">{hint}</Text>
      </Stack>
    </Card>
  )
}

function QuickAction({ icon: Icon, label, hint, onClick }: {
  icon: LucideIcon; label: string; hint: string; onClick: () => void
}) {
  return (
    <Card padding="comfortable" style={{ cursor: 'pointer', height: '100%' }} onClick={onClick}>
      <Stack gap="8px">
        <Box w="34px" h="34px" borderRadius="lg" bg="accent.subtle" color="accent.text"
          display="flex" alignItems="center" justifyContent="center">
          <Icon size={17} />
        </Box>
        <Stack gap="0">
          <Text fontSize="sm" fontWeight="semibold">{label}</Text>
          <Text fontSize="xs" color="text.tertiary">{hint}</Text>
        </Stack>
      </Stack>
    </Card>
  )
}

function PersonRow({ student, tone, onOpen }: {
  student: GroupStudentRow; tone: 'error' | 'success'; onOpen: () => void
}) {
  const acc = Math.round(student.accuracy * 100)
  return (
    <Flex role="button" onClick={onOpen} align="center" gap="10px" p="8px 10px"
      borderRadius="md" cursor="pointer" _hover={{ bg: 'bg.subtle' }} transition="background 120ms">
      <Avatar size="sm" name={`${student.firstName}${student.lastName ? ` ${student.lastName}` : ''}`} />
      <Stack gap="0" flex="1" minW="0">
        <Text fontSize="sm" fontWeight="medium" truncate>
          {student.firstName}{student.lastName ? ` ${student.lastName}` : ''}
        </Text>
        <Text fontSize="xs" color="text.tertiary">
          {student.level ?? 'no level'} · {student.answered} answers
        </Text>
      </Stack>
      <Badge tone={tone} shape="pill">{acc}%</Badge>
      <Box color="text.tertiary"><ArrowRight size={14} /></Box>
    </Flex>
  )
}

interface Item {
  id: string
  title: string
  subtitle: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null
  onOpen: () => void
}

function Section({
  title, count, icon, onAllClick, onCreate, isLoading, emptyText, items,
}: {
  title: string; count: string; icon: React.ReactNode; onAllClick: () => void; onCreate: () => void
  isLoading: boolean; emptyText: string; items: Item[]
}) {
  return (
    <Card padding="comfortable" style={{ height: '100%' }}>
      <Stack gap="14px" h="100%">
        <Flex justify="space-between" align="center">
          <Flex align="center" gap="8px" color="text.primary">
            <Box color="accent.text">{icon}</Box>
            <Text fontSize="md" fontWeight="semibold">{title}</Text>
            <Badge tone="neutral" shape="pill">{count}</Badge>
          </Flex>
          <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={onCreate}>New</Button>
        </Flex>

        {isLoading ? (
          <Stack gap="6px" flex="1">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h="44px" borderRadius="md" />)}
          </Stack>
        ) : items.length === 0 ? (
          <Box flex="1" display="flex" alignItems="center" justifyContent="center" py="20px">
            <Text fontSize="sm" color="text.tertiary" textAlign="center">{emptyText}</Text>
          </Box>
        ) : (
          <Stack gap="2px" flex="1">
            {items.map((item) => (
              <Flex key={item.id} role="button" onClick={item.onOpen} align="center" gap="10px"
                p="10px 12px" borderRadius="md" cursor="pointer" _hover={{ bg: 'bg.subtle' }}
                transition="background 120ms">
                <Stack gap="2px" flex="1" minW="0">
                  <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>{item.title}</Text>
                  <Flex gap="6px" align="center">
                    <Text fontSize="xs" color="text.tertiary">{item.subtitle}</Text>
                    {item.status === 'ARCHIVED' && (
                      <Badge tone="warning" intensity="subtle" shape="pill">archived</Badge>
                    )}
                  </Flex>
                </Stack>
                <Box color="text.tertiary"><ArrowRight size={14} /></Box>
              </Flex>
            ))}
          </Stack>
        )}

        <Button size="sm" variant="ghost" onClick={onAllClick}>View all</Button>
      </Stack>
    </Card>
  )
}
