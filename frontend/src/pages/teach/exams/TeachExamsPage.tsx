import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { Sparkles, BarChart3, Check, Eye, Plus, Trash2, Pencil } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { coursesApi, examsApi, lessonsApi, extractApiError } from '@shared/api'
import type { ExamDetail, ExamDetailQuestion, ExamResults, ExamSummary, ExamType } from '@shared/api'
import type { QuestionType } from '@shared/model'
import { Badge, Button, Card, Dialog, Input, NativeButton, Skeleton, showToast } from '@shared/ui'

export function TeachExamsPage() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [courseId, setCourseId] = useState<string | null>(null)
  const [results, setResults] = useState<ExamResults | null>(null)
  const [preview, setPreview] = useState<ExamDetail | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  // форма экзамена (создание/редактирование)
  const [exTitle, setExTitle] = useState('')
  const [exType, setExType] = useState<ExamType>('CHECKPOINT')
  const [exUnitNums, setExUnitNums] = useState<number[]>([])
  const [exPass, setExPass] = useState('60')
  const [genAfter, setGenAfter] = useState(true)
  const [exCount, setExCount] = useState(12)
  // типы вопросов экзамена (мультивыбор)
  const [exTypes, setExTypes] = useState<QuestionType[]>(['MULTIPLE_CHOICE'])
  const toggleExType = (t: QuestionType) =>
    setExTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  // отдельный диалог генерации (для существующего экзамена)
  const [genExam, setGenExam] = useState<ExamSummary | null>(null)
  const [genCount, setGenCount] = useState(12)
  const [genTypes, setGenTypes] = useState<QuestionType[]>(['MULTIPLE_CHOICE'])
  const toggleGenType = (t: QuestionType) =>
    setGenTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const coursesQuery = useQuery({
    queryKey: ['courses', 'my', 'teach-exams'],
    queryFn: coursesApi.my,
  })
  // English for IT — первым и по порядку (Semester 1 → 2), остальные после
  const courses = [...(coursesQuery.data ?? [])].sort((a, b) => {
    const ap = a.slug.startsWith('english-for-it') ? 0 : 1
    const bp = b.slug.startsWith('english-for-it') ? 0 : 1
    if (ap !== bp) return ap - bp
    if (ap === 0) return a.slug.localeCompare(b.slug)
    return a.title.localeCompare(b.title)
  })
  // приоритет: явный клик по чипу → ?courseId= из URL → первый курс
  const urlCourseId = searchParams.get('courseId')
  const selectedId = courseId ?? urlCourseId ?? courses[0]?.id ?? null

  const selectCourse = (id: string) => {
    setCourseId(id)
    setSearchParams((prev) => {
      prev.set('courseId', id)
      return prev
    }, { replace: true })
  }

  const examsQuery = useQuery({
    queryKey: ['exams', 'course', selectedId, 'teach'],
    queryFn: () => examsApi.listForCourse(selectedId!),
    enabled: Boolean(selectedId),
  })

  // юниты выбранного курса — для селекта в форме экзамена
  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'byCourse', 'teach', selectedId],
    queryFn: () => lessonsApi.myByCourse(selectedId!),
    enabled: Boolean(selectedId),
  })
  // [{ n: номер юнита из заголовка "Unit N: ...", title }]
  const courseUnits = (lessonsQuery.data ?? [])
    .map((l) => ({ n: parseUnitNum(l.title), title: l.title }))
    .filter((u): u is { n: number; title: string } => u.n !== null)
    .sort((a, b) => a.n - b.n)

  const toggleUnit = (n: number) =>
    setExUnitNums((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b),
    )

  const generateMutation = useMutation({
    mutationFn: () => examsApi.generate(genExam!.id, genCount, genTypes.length > 0 ? genTypes : undefined),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['exams', 'course', selectedId] })
      showToast({ type: 'success', title: `Generated ${res.generated} questions` })
      setGenExam(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const resultsMutation = useMutation({
    mutationFn: (examId: string) => examsApi.results(examId),
    onSuccess: setResults,
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const previewMutation = useMutation({
    mutationFn: (examId: string) => examsApi.detail(examId),
    onSuccess: setPreview,
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const resetForm = () => {
    setExTitle(''); setExUnitNums([]); setExType('CHECKPOINT'); setExPass('60')
    setGenAfter(true); setExCount(12); setExTypes(['MULTIPLE_CHOICE'])
  }

  const openCreate = () => { resetForm(); setEditId(null); setCreateOpen(true) }
  const openEdit = (exam: ExamSummary) => {
    setExTitle(exam.title); setExType(exam.type)
    setExUnitNums(parseUnitsLabel(exam.unitsLabel)); setExPass(String(exam.passingScore))
    setEditId(exam.id); setCreateOpen(true)
  }

  // метка юнитов из выбранных номеров: "Units 1-3" / "Unit 5" / undefined (весь курс)
  const unitsLabelFromSelection = (): string | undefined => {
    if (exUnitNums.length === 0) return undefined
    const min = Math.min(...exUnitNums)
    const max = Math.max(...exUnitNums)
    return min === max ? `Unit ${min}` : `Units ${min}-${max}`
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const exam = await examsApi.create({
        courseId: selectedId!,
        title: exTitle.trim(),
        type: exType,
        unitsLabel: unitsLabelFromSelection(),
        passingScore: Number(exPass) || undefined,
      })
      // создать «с ИИ»: сразу сгенерировать вопросы (если выбрано)
      if (genAfter) {
        const types = exTypes.length > 0 ? exTypes : (['MULTIPLE_CHOICE'] as QuestionType[])
        try {
          await examsApi.generate(exam.id, exCount, types)
        } catch {
          showToast({ type: 'info', title: 'Exam created — generate questions failed, try Generate on the exam.' })
        }
      }
      return exam
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['exams', 'course', selectedId] })
      showToast({ type: 'success', title: 'Exam created' })
      setCreateOpen(false); resetForm()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const updateMutation = useMutation({
    mutationFn: () => examsApi.update(editId!, {
      title: exTitle.trim(),
      type: exType,
      unitsLabel: unitsLabelFromSelection(),
      passingScore: Number(exPass) || undefined,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['exams', 'course', selectedId] })
      showToast({ type: 'success', title: 'Exam updated' })
      setCreateOpen(false); setEditId(null); resetForm()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const removeQuestionMutation = useMutation({
    mutationFn: (questionId: string) => examsApi.removeQuestion(questionId),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ['exams', 'course', selectedId] })
      if (preview) setPreview(await examsApi.detail(preview.id))
      showToast({ type: 'info', title: 'Question removed' })
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  // ручное добавление вопроса
  const [addOpen, setAddOpen] = useState(false)
  const [aqType, setAqType] = useState<'MULTIPLE_CHOICE' | 'FILL_BLANK'>('MULTIPLE_CHOICE')
  const [aqPrompt, setAqPrompt] = useState('')
  const [aqOptions, setAqOptions] = useState('') // по строке на вариант
  const [aqCorrect, setAqCorrect] = useState(0)
  const [aqText, setAqText] = useState('') // для fill blank, с ___
  const [aqAnswers, setAqAnswers] = useState('') // через запятую

  const resetAddForm = () => {
    setAqType('MULTIPLE_CHOICE'); setAqPrompt(''); setAqOptions(''); setAqCorrect(0)
    setAqText(''); setAqAnswers('')
  }

  const addQuestionMutation = useMutation({
    mutationFn: () => {
      const payload =
        aqType === 'MULTIPLE_CHOICE'
          ? { options: aqOptions.split('\n').map((s) => s.trim()).filter(Boolean), correctIndex: aqCorrect }
          : {
              text: aqText.trim(),
              correctAnswers: aqAnswers.split(',').map((s) => s.trim()).filter(Boolean),
              caseSensitive: false,
            }
      return examsApi.addQuestion(preview!.id, {
        type: aqType,
        prompt: aqPrompt.trim(),
        payload,
      })
    },
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ['exams', 'course', selectedId] })
      if (preview) setPreview(await examsApi.detail(preview.id))
      showToast({ type: 'success', title: 'Question added' })
      setAddOpen(false); resetAddForm()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const addValid =
    aqPrompt.trim().length > 0 &&
    (aqType === 'MULTIPLE_CHOICE'
      ? aqOptions.split('\n').map((s) => s.trim()).filter(Boolean).length >= 2 &&
        aqCorrect < aqOptions.split('\n').map((s) => s.trim()).filter(Boolean).length
      : aqText.includes('___') && aqAnswers.trim().length > 0)

  const deleteMutation = useMutation({
    mutationFn: (examId: string) => examsApi.remove(examId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['exams', 'course', selectedId] })
      showToast({ type: 'success', title: 'Exam deleted' })
      setPendingDelete(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const exams = examsQuery.data ?? []

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="960px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap="14px"
          mb="24px" direction={{ base: 'column', md: 'row' }}>
          <Stack gap="6px">
            <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
              Exams
            </Heading>
            <Text fontSize="md" color="text.secondary">
              Create a checkpoint or final exam, generate its questions with AI, then track results.
            </Text>
          </Stack>
          <Button leftIcon={<Plus size={14} />} disabled={!selectedId} onClick={openCreate}>
            New exam
          </Button>
        </Flex>

        <Flex gap="8px" wrap="wrap" mb="20px">
          {coursesQuery.isLoading && <Skeleton h="34px" w="220px" borderRadius="full" />}
          {courses.map((c) => (
            <NativeButton key={c.id} onClick={() => selectCourse(c.id)}
              px="12px" py="6px" borderRadius="full" border="1px solid"
              borderColor={selectedId === c.id ? 'accent.solid' : 'border.default'}
              bg={selectedId === c.id ? 'accent.subtle' : 'transparent'}
              color={selectedId === c.id ? 'accent.text' : 'text.secondary'} fontSize="sm">
              {c.title}
            </NativeButton>
          ))}
        </Flex>

        {examsQuery.isLoading ? (
          <Stack gap="10px">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h="72px" borderRadius="lg" />)}
          </Stack>
        ) : exams.length === 0 ? (
          <Card padding="spacious">
            <Stack gap="8px" align="center" textAlign="center" py="20px">
              <Text fontSize="md" fontWeight="semibold">No exams yet</Text>
              <Text fontSize="sm" color="text.secondary">
                Create a checkpoint or final exam, then let AI write the questions.
              </Text>
              <Box mt="6px">
                <Button size="sm" leftIcon={<Plus size={14} />} disabled={!selectedId}
                  onClick={openCreate}>
                  New exam
                </Button>
              </Box>
            </Stack>
          </Card>
        ) : (
          <Stack gap="10px" maxH="64vh" overflowY="auto">
            {exams.map((exam) => (
              <ExamRow key={exam.id} exam={exam}
                previewing={previewMutation.isPending && previewMutation.variables === exam.id}
                onGenerate={() => { setGenExam(exam); setGenCount(Math.max(exam.questionCount || 12, 4)); setGenTypes(['MULTIPLE_CHOICE']) }}
                onPreview={() => previewMutation.mutate(exam.id)}
                onResults={() => resultsMutation.mutate(exam.id)}
                onEdit={() => openEdit(exam)}
                onDelete={() => setPendingDelete(exam.id)} />
            ))}
          </Stack>
        )}
      </Container>

      <Dialog open={Boolean(results)} onOpenChange={(o) => !o && setResults(null)}
        title={results?.exam.title} size="lg">
        {results && (
          <Stack gap="14px">
            <Flex gap="20px" wrap="wrap">
              <Stat label="Students" value={String(results.stats.students)} />
              <Stat label="Average" value={results.stats.averageScore != null ? `${results.stats.averageScore}%` : '—'} />
              <Stat label="Passed" value={String(results.stats.passed)} />
            </Flex>
            {results.students.length === 0 ? (
              <Text fontSize="sm" color="text.secondary">No completed attempts yet.</Text>
            ) : (
              <Stack gap="6px" maxH="58vh" overflowY="auto">
                {[...results.students]
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .map((s) => (
                  <Flex key={s.userId} align="center" justify="space-between" px="12px" py="8px"
                    borderRadius="md" bg="bg.subtle">
                    <Text fontSize="sm">{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}</Text>
                    <Flex align="center" gap="8px">
                      <Text fontSize="sm" fontWeight="medium" fontVariantNumeric="tabular-nums">{s.score}%</Text>
                      {s.passed && <Box color="accent.text"><Check size={15} /></Box>}
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}
        title={preview?.title} size="lg">
        {preview && (
          <Stack gap="14px">
            <Flex align="center" justify="space-between" gap="10px" wrap="wrap">
              <Text fontSize="xs" color="text.tertiary">
                {preview.unitsLabel ?? ''} · {preview.questions.length} questions · pass {preview.passingScore}%
              </Text>
              <Button size="sm" variant="secondary" leftIcon={<Plus size={13} />}
                onClick={() => { resetAddForm(); setAddOpen(true) }}>
                Add question
              </Button>
            </Flex>
            {preview.questions.length === 0 ? (
              <Text fontSize="sm" color="text.secondary">No questions yet. Add one or use Generate.</Text>
            ) : (
              <Stack gap="12px" maxH="60vh" overflowY="auto">
                {preview.questions.map((q, i) => (
                  <Box key={q.id} position="relative">
                    <QuestionPreview index={i} q={q} />
                    <Box position="absolute" top="8px" right="8px">
                      <IconBtn label="Remove question" tone="error"
                        onClick={() => removeQuestionMutation.mutate(q.id)}>
                        <Trash2 size={13} />
                      </IconBtn>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Dialog>

      {/* Создание / редактирование экзамена */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditId(null) } }}
        title={editId ? 'Edit exam' : 'New exam'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCreateOpen(false); setEditId(null) }}
              disabled={createMutation.isPending || updateMutation.isPending}>
              Cancel
            </Button>
            {editId ? (
              <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}
                disabled={exTitle.trim().length < 3}>
                Save changes
              </Button>
            ) : (
              <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}
                disabled={exTitle.trim().length < 3 || (genAfter && exTypes.length === 0)}>
                Create exam
              </Button>
            )}
          </>
        }>
        <Stack gap="14px">
          <Input label="Title" value={exTitle} onChange={(e) => setExTitle(e.target.value)}
            placeholder="Checkpoint: Units 1-3" hint="Minimum 3 characters." />

          <Box>
            <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">Type</Text>
            <Flex gap="6px">
              {(['CHECKPOINT', 'FINAL'] as ExamType[]).map((t) => (
                <NativeButton key={t} type="button"
                  onClick={() => { setExType(t); setExPass(t === 'FINAL' ? '70' : '60') }}
                  px="14px" h="32px" borderRadius="full" border="1px solid"
                  bg={exType === t ? 'accent.surface' : 'bg.subtle'}
                  color={exType === t ? 'accent.text' : 'text.secondary'}
                  borderColor={exType === t ? 'border.accent' : 'border.subtle'}
                  fontSize="xs" fontWeight="medium" cursor="pointer">
                  {t === 'FINAL' ? 'Final' : 'Checkpoint'}
                </NativeButton>
              ))}
            </Flex>
          </Box>

          <Flex gap="12px" wrap="wrap" align="flex-start">
            <Box flex="1" minW="220px">
              <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
                Units covered
              </Text>
              {courseUnits.length === 0 ? (
                <Text fontSize="sm" color="text.tertiary">No units in this course yet.</Text>
              ) : (
                <Flex gap="6px" wrap="wrap">
                  {courseUnits.map((u) => {
                    const active = exUnitNums.includes(u.n)
                    return (
                      <NativeButton key={u.n} type="button" onClick={() => toggleUnit(u.n)}
                        title={u.title}
                        px="12px" h="32px" borderRadius="full" border="1px solid"
                        bg={active ? 'accent.surface' : 'bg.subtle'}
                        color={active ? 'accent.text' : 'text.secondary'}
                        borderColor={active ? 'border.accent' : 'border.subtle'}
                        fontSize="xs" fontWeight="medium" cursor="pointer">
                        Unit {u.n}
                      </NativeButton>
                    )
                  })}
                </Flex>
              )}
              <Text fontSize="xs" color="text.tertiary" mt="6px">
                {exUnitNums.length === 0
                  ? 'None selected = whole course.'
                  : `Covers ${unitsLabelFromSelection()}. The exam unlocks after these units are completed.`}
              </Text>
            </Box>
            <Box w="140px">
              <Input label="Min % to pass" type="number" value={exPass}
                onChange={(e) => setExPass(e.target.value)} hint="e.g. 60" />
            </Box>
          </Flex>

          {!editId && (
            <>
              <Box>
                <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">Question types</Text>
                <Flex gap="6px" wrap="wrap">
                  {([
                    { v: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
                    { v: 'FILL_BLANK', label: 'Fill the blank' },
                    { v: 'DRAG_DROP', label: 'Word order' },
                    { v: 'MATCH_PAIRS', label: 'Match pairs' },
                  ] as { v: QuestionType; label: string }[]).map((t) => {
                    const active = exTypes.includes(t.v)
                    return (
                      <NativeButton key={t.v} type="button" onClick={() => toggleExType(t.v)}
                        px="14px" h="32px" borderRadius="full" border="1px solid"
                        bg={active ? 'accent.surface' : 'bg.subtle'}
                        color={active ? 'accent.text' : 'text.secondary'}
                        borderColor={active ? 'border.accent' : 'border.subtle'}
                        fontSize="xs" fontWeight="medium" cursor="pointer">
                        {t.label}
                      </NativeButton>
                    )
                  })}
                </Flex>
              </Box>

              <Box>
                <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">Number of questions</Text>
                <Flex gap="6px" wrap="wrap">
                  {[8, 12, 16, 20].map((n) => (
                    <NativeButton key={n} type="button" onClick={() => setExCount(n)}
                      px="14px" h="32px" borderRadius="full" border="1px solid"
                      bg={exCount === n ? 'accent.surface' : 'bg.subtle'}
                      color={exCount === n ? 'accent.text' : 'text.secondary'}
                      borderColor={exCount === n ? 'border.accent' : 'border.subtle'}
                      fontSize="xs" fontWeight="medium" cursor="pointer">
                      {n}
                    </NativeButton>
                  ))}
                </Flex>
              </Box>

              <Flex align="center" gap="10px" p="10px 12px" bg="bg.subtle" borderRadius="md"
                border="1px solid" borderColor="border.subtle">
                <input type="checkbox" checked={genAfter} onChange={(e) => setGenAfter(e.target.checked)} />
                <Box>
                  <Text fontSize="sm" fontWeight="medium">Generate questions with AI now</Text>
                  <Text fontSize="xs" color="text.tertiary">
                    Creates the questions from the lessons. Needs an AI key — you can also do it later.
                  </Text>
                </Box>
              </Flex>
            </>
          )}
        </Stack>
      </Dialog>

      {/* Генерация вопросов (для существующего экзамена) */}
      <Dialog open={Boolean(genExam)} onOpenChange={(o) => !o && setGenExam(null)}
        title={genExam ? `Generate: ${genExam.title}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setGenExam(null)} disabled={generateMutation.isPending}>Cancel</Button>
            <Button leftIcon={<Sparkles size={14} />} loading={generateMutation.isPending}
              disabled={genTypes.length === 0} onClick={() => generateMutation.mutate()}>
              Generate
            </Button>
          </>
        }>
        <Stack gap="14px">
          <Text fontSize="sm" color="text.secondary">
            This replaces all current questions with freshly generated ones.
          </Text>
          <Box>
            <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">Question types</Text>
            <Flex gap="6px" wrap="wrap">
              {([
                { v: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
                { v: 'FILL_BLANK', label: 'Fill the blank' },
                { v: 'DRAG_DROP', label: 'Word order' },
                { v: 'MATCH_PAIRS', label: 'Match pairs' },
              ] as { v: QuestionType; label: string }[]).map((t) => {
                const active = genTypes.includes(t.v)
                return (
                  <NativeButton key={t.v} type="button" onClick={() => toggleGenType(t.v)}
                    px="14px" h="32px" borderRadius="full" border="1px solid"
                    bg={active ? 'accent.surface' : 'bg.subtle'}
                    color={active ? 'accent.text' : 'text.secondary'}
                    borderColor={active ? 'border.accent' : 'border.subtle'}
                    fontSize="xs" fontWeight="medium" cursor="pointer">
                    {t.label}
                  </NativeButton>
                )
              })}
            </Flex>
          </Box>
          <Box>
            <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">Number of questions</Text>
            <Flex gap="6px" wrap="wrap">
              {[8, 12, 16, 20].map((n) => (
                <NativeButton key={n} type="button" onClick={() => setGenCount(n)}
                  px="14px" h="32px" borderRadius="full" border="1px solid"
                  bg={genCount === n ? 'accent.surface' : 'bg.subtle'}
                  color={genCount === n ? 'accent.text' : 'text.secondary'}
                  borderColor={genCount === n ? 'border.accent' : 'border.subtle'}
                  fontSize="xs" fontWeight="medium" cursor="pointer">
                  {n}
                </NativeButton>
              ))}
            </Flex>
          </Box>
        </Stack>
      </Dialog>

      {/* Ручное добавление вопроса */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); resetAddForm() } }}
        title="Add question"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAddOpen(false); resetAddForm() }}
              disabled={addQuestionMutation.isPending}>Cancel</Button>
            <Button onClick={() => addQuestionMutation.mutate()} loading={addQuestionMutation.isPending}
              disabled={!addValid}>Add</Button>
          </>
        }>
        <Stack gap="14px">
          <Box>
            <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">Type</Text>
            <Flex gap="6px">
              {([
                { v: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
                { v: 'FILL_BLANK', label: 'Fill the blank' },
              ] as const).map((t) => (
                <NativeButton key={t.v} type="button" onClick={() => setAqType(t.v)}
                  px="14px" h="32px" borderRadius="full" border="1px solid"
                  bg={aqType === t.v ? 'accent.surface' : 'bg.subtle'}
                  color={aqType === t.v ? 'accent.text' : 'text.secondary'}
                  borderColor={aqType === t.v ? 'border.accent' : 'border.subtle'}
                  fontSize="xs" fontWeight="medium" cursor="pointer">
                  {t.label}
                </NativeButton>
              ))}
            </Flex>
          </Box>
          <Input label="Question" value={aqPrompt} onChange={(e) => setAqPrompt(e.target.value)}
            placeholder={aqType === 'FILL_BLANK' ? 'Choose the correct word' : 'Which sentence is correct?'} />

          {aqType === 'MULTIPLE_CHOICE' ? (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb="2px">Options</Text>
              <Text fontSize="xs" color="text.tertiary" mb="6px">One per line. Pick the correct one below.</Text>
              <textarea value={aqOptions} onChange={(e) => setAqOptions(e.target.value)} rows={4}
                placeholder={'She goes to work\nShe go to work'}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--se-colors-bg-surface)',
                  border: '1px solid var(--se-colors-border-default)', borderRadius: 10,
                  color: 'var(--se-colors-text-primary)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
              <Flex gap="6px" wrap="wrap" mt="8px">
                {aqOptions.split('\n').map((s) => s.trim()).filter(Boolean).map((opt, i) => (
                  <NativeButton key={i} type="button" onClick={() => setAqCorrect(i)}
                    px="12px" h="30px" borderRadius="full" border="1px solid"
                    bg={aqCorrect === i ? 'accent.surface' : 'bg.subtle'}
                    color={aqCorrect === i ? 'accent.text' : 'text.secondary'}
                    borderColor={aqCorrect === i ? 'border.accent' : 'border.subtle'}
                    fontSize="xs" cursor="pointer">
                    {aqCorrect === i ? 'Correct: ' : ''}{opt.slice(0, 24)}
                  </NativeButton>
                ))}
              </Flex>
            </Box>
          ) : (
            <Stack gap="10px">
              <Input label="Sentence with a blank" value={aqText} onChange={(e) => setAqText(e.target.value)}
                placeholder="She ___ to work every day." hint="Use ___ to mark the blank." />
              <Input label="Correct answers" value={aqAnswers} onChange={(e) => setAqAnswers(e.target.value)}
                placeholder="goes, walks" hint="Comma-separated; any of them counts as correct." />
            </Stack>
          )}
        </Stack>
      </Dialog>

      {/* Удаление экзамена */}
      <Dialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete exam?" description="The exam and all its questions and attempts will be removed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" loading={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}>
              Delete
            </Button>
          </>
        } />
    </Box>
  )
}

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  FILL_BLANK: 'Fill the blank',
  DRAG_DROP: 'Word order',
  MATCH_PAIRS: 'Match pairs',
}

function QuestionPreview({ index, q }: { index: number; q: ExamDetailQuestion }) {
  const p = q.payload
  return (
    <Box px="14px" py="12px" borderRadius="md" bg="bg.subtle" border="1px solid" borderColor="border.default">
      <Flex align="center" gap="8px" mb="6px" wrap="wrap">
        <Text fontSize="xs" color="text.tertiary" fontVariantNumeric="tabular-nums">Q{index + 1}</Text>
        <Badge tone="neutral" shape="pill">{TYPE_LABEL[q.type] ?? q.type}</Badge>
        <Text fontSize="xs" color="text.tertiary">{q.points} pts</Text>
      </Flex>
      <Text fontSize="sm" fontWeight="medium" mb="6px">{q.prompt}</Text>
      <AnswerBody type={q.type} payload={p} />
    </Box>
  )
}

function AnswerBody({ type, payload }: { type: string; payload: Record<string, unknown> }) {
  if (type === 'MULTIPLE_CHOICE') {
    const options = (payload.options as string[]) ?? []
    const correct = payload.correctIndex as number
    return (
      <Stack gap="3px">
        {options.map((opt, i) => (
          <Flex key={i} align="center" gap="6px">
            <Box color={i === correct ? 'accent.text' : 'text.tertiary'} w="14px">
              {i === correct ? <Check size={13} /> : null}
            </Box>
            <Text fontSize="sm" color={i === correct ? 'text.primary' : 'text.secondary'}
              fontWeight={i === correct ? 'medium' : 'normal'}>{opt}</Text>
          </Flex>
        ))}
      </Stack>
    )
  }
  if (type === 'FILL_BLANK') {
    const text = payload.text as string
    const answers = (payload.correctAnswers as string[]) ?? []
    return (
      <Stack gap="4px">
        <Text fontSize="sm" color="text.secondary">{text}</Text>
        <Text fontSize="sm">Answer: <Box as="span" color="accent.text" fontWeight="medium">{answers.join(' / ')}</Box></Text>
      </Stack>
    )
  }
  if (type === 'DRAG_DROP') {
    const words = (payload.words as string[]) ?? []
    return (
      <Text fontSize="sm">Correct order: <Box as="span" color="accent.text" fontWeight="medium">{words.join(' ')}</Box></Text>
    )
  }
  if (type === 'MATCH_PAIRS') {
    const pairs = (payload.pairs as { left: string; right: string }[]) ?? []
    return (
      <Stack gap="3px">
        {pairs.map((pr, i) => (
          <Text key={i} fontSize="sm">
            <Box as="span" color="text.secondary">{pr.left}</Box>
            <Box as="span" color="text.tertiary"> → </Box>
            <Box as="span" color="accent.text" fontWeight="medium">{pr.right}</Box>
          </Text>
        ))}
      </Stack>
    )
  }
  return null
}

function ExamRow({ exam, previewing, onGenerate, onPreview, onResults, onEdit, onDelete }: {
  exam: ExamSummary
  previewing: boolean
  onGenerate: () => void
  onPreview: () => void
  onResults: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const ready = exam.questionCount > 0
  return (
    <Card padding="comfortable">
      <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
        <Stack gap="2px" minW="0">
          <Flex align="center" gap="8px" wrap="wrap">
            <Text fontSize="md" fontWeight="medium">{exam.title}</Text>
            <Badge tone={exam.type === 'FINAL' ? 'accent' : 'neutral'} shape="pill">
              {exam.type === 'FINAL' ? 'Final' : 'Checkpoint'}
            </Badge>
          </Flex>
          <Text fontSize="xs" color="text.tertiary">
            {exam.unitsLabel ?? ''} · {ready ? `${exam.questionCount} questions` : 'no questions yet'} · pass {exam.passingScore}%
          </Text>
        </Stack>
        <Flex gap="8px" flexShrink={0}>
          <Button size="sm" variant="ghost" disabled={!ready} loading={previewing} onClick={onPreview}>
            <Eye size={14} /> Preview
          </Button>
          <Button size="sm" variant="secondary" onClick={onGenerate}>
            <Sparkles size={14} /> {ready ? 'Regenerate' : 'Generate'}
          </Button>
          <Button size="sm" variant="ghost" disabled={!ready} onClick={onResults}>
            <BarChart3 size={14} /> Results
          </Button>
          <IconBtn label="Edit exam" onClick={onEdit}><Pencil size={14} /></IconBtn>
          <IconBtn label="Delete exam" tone="error" onClick={onDelete}><Trash2 size={14} /></IconBtn>
        </Flex>
      </Flex>
    </Card>
  )
}

function IconBtn({ children, onClick, label, tone }: {
  children: React.ReactNode
  onClick: () => void
  label: string
  tone?: 'error'
}) {
  return (
    <NativeButton type="button" onClick={onClick} aria-label={label} title={label}
      display="inline-flex" alignItems="center" justifyContent="center" w="32px" h="32px"
      bg="transparent" border="1px solid" borderColor="transparent" borderRadius="md"
      color="text.tertiary" cursor="pointer"
      _hover={{ bg: 'bg.subtle', color: tone === 'error' ? 'error' : 'text.primary' }}>
      {children}
    </NativeButton>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="2px">
      <Text fontSize="xs" color="text.tertiary" textTransform="uppercase" letterSpacing="wide">{label}</Text>
      <Text fontSize="xl" fontWeight="semibold">{value}</Text>
    </Stack>
  )
}

// Номер юнита из заголовка урока ("Unit 12: ..." → 12)
function parseUnitNum(title: string): number | null {
  const m = title.match(/unit\s+(\d+)/i)
  return m ? Number(m[1]) : null
}

// Метка экзамена ("Units 1-3" / "Unit 5") → список номеров юнитов в диапазоне
function parseUnitsLabel(label: string | null | undefined): number[] {
  if (!label) return []
  const nums = label.match(/\d+/g)
  if (!nums || nums.length === 0) return []
  const from = Math.min(...nums.map(Number))
  const to = Math.max(...nums.map(Number))
  const out: number[] = []
  for (let n = from; n <= to; n++) out.push(n)
  return out
}
