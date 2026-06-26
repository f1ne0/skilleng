import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { Mic, Square, RotateCcw, CloudUpload, Check } from 'lucide-react'
import { Button, Card, showToast } from '@shared/ui'
import { uploadsApi, extractApiError } from '@shared/api'
import type { SpeakingStep, StepStatus } from '../types'
import { AudioPlayer } from './AudioPlayer'

const BAR_COUNT = 28

interface Props {
  step: SpeakingStep
  /** Загруженный audioUrl (LocalAnswer) или '' */
  audioUrl: string
  status: StepStatus
  onChange: (audioUrl: string) => void
}

type RecState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'uploaded'

/**
 * Устный ответ: запись через MediaRecorder → загрузка в R2 (presigned,
 * purpose SPEAKING_RESPONSE) → audioUrl уходит в обычный submit.
 *
 * ОГРАНИЧЕНИЕ (намеренное): AI оценивает содержание/грамматику/беглость —
 * это НЕ инструментальный пофонемный анализ произношения.
 */
export function StepSpeaking({ step, audioUrl, status, onChange }: Props) {
  const [recState, setRecState] = useState<RecState>(audioUrl ? 'uploaded' : 'idle')
  const [seconds, setSeconds] = useState(0)
  const [localBlob, setLocalBlob] = useState<Blob | null>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const smoothRef = useRef<number[]>(new Array(BAR_COUNT).fill(0))
  // полосы индикатора — меняем высоту напрямую через DOM (без setState 60fps)
  const barsRef = useRef<(HTMLDivElement | null)[]>([])

  const paintBar = (i: number, v: number) => {
    const el = barsRef.current[i]
    if (!el) return
    el.style.height = `${Math.round(5 + v * 51)}px`
    el.style.opacity = String(0.45 + v * 0.55)
  }
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)

  const stopMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    analyserRef.current = null
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    smoothRef.current = new Array(BAR_COUNT).fill(0)
    for (let i = 0; i < BAR_COUNT; i++) paintBar(i, 0)
  }

  const startMeter = (stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      // AudioContext часто стартует в 'suspended' — без resume данных не будет
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.1
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      const bins = analyser.frequencyBinCount
      const freq = new Uint8Array(bins)

      const usable = Math.floor(bins * 0.7) // нижне-средние частоты — там энергия голоса
      const center = (BAR_COUNT - 1) / 2

      const tick = () => {
        const a = analyserRef.current
        if (!a) return
        a.getByteFrequencyData(freq)

        const smooth = smoothRef.current
        for (let i = 0; i < BAR_COUNT; i++) {
          // зеркально от центра: центр = низкие частоты (голос), края = выше
          const d = Math.abs(i - center) / center // 0 в центре, 1 на краях
          const idx = Math.floor(d * (usable - 1))
          const amp = (freq[idx] ?? 0) / 255
          const target = Math.min(1, amp * 1.4)
          // резко: мгновенный подъём по голосу, быстрый спад
          const prev = smooth[i]!
          const v = target > prev ? target : prev + (target - prev) * 0.5
          smooth[i] = v
          paintBar(i, v) // прямой DOM, без React-перерисовки
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      // визуализатор не критичен — запись продолжается без него
    }
  }

  const maxSeconds = step.maxSeconds ?? 180
  const minSeconds = step.minSeconds ?? 5

  // Чистим object URL и таймер при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (localUrl) URL.revokeObjectURL(localUrl)
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
      stopMeter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setLocalBlob(blob)
        setLocalUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(blob)
        })
        setRecState('recorded')
        stopMeter()
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      startMeter(stream)
      setSeconds(0)
      setRecState('recording')
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          // автостоп на максимуме
          if (s + 1 >= maxSeconds) stopRecording()
          return s + 1
        })
      }, 1000)
    } catch {
      showToast({
        type: 'error',
        title: 'Microphone unavailable',
        description: 'Allow microphone access in your browser and try again.',
      })
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  const reset = () => {
    setRecState('idle')
    setSeconds(0)
    setLocalBlob(null)
    if (localUrl) {
      URL.revokeObjectURL(localUrl)
      setLocalUrl(null)
    }
    onChange('')
  }

  const upload = async () => {
    if (!localBlob) return
    setRecState('uploading')
    try {
      // Конвертируем запись в WAV — Gemini не декодирует webm/mp4,
      // а WAV распознаёт корректно (иначе AI «выдумывает» ответ).
      let file: File
      try {
        const wav = await blobToWav(localBlob)
        file = new File([wav], 'speaking.wav', { type: 'audio/wav' })
      } catch {
        // запасной путь: грузим как есть
        const ext = localBlob.type.includes('mp4') ? 'm4a' : 'weba'
        file = new File([localBlob], `speaking.${ext}`, { type: localBlob.type })
      }
      const publicUrl = await uploadsApi.uploadFile(file, 'SPEAKING_RESPONSE')
      onChange(publicUrl)
      setRecState('uploaded')
    } catch (err) {
      setRecState('recorded')
      showToast({ type: 'error', title: extractApiError(err) })
    }
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <Stack gap="20px">
      <Heading
        as="h2"
        fontSize={{ base: '2xl', md: '3xl' }}
        fontWeight="semibold"
        letterSpacing="tight"
        lineHeight="tight"
      >
        {step.prompt}
      </Heading>

      {step.expectedKeyPoints && step.expectedKeyPoints.length > 0 && (
        <Card padding="comfortable">
          <Text fontSize="sm" fontWeight="medium" mb="6px">Try to cover:</Text>
          <Stack gap="4px">
            {step.expectedKeyPoints.map((point, i) => (
              <Text key={i} fontSize="sm" color="text.secondary">• {point}</Text>
            ))}
          </Stack>
        </Card>
      )}

      <Card padding="comfortable">
        <Stack gap="14px" align="center" py="10px">
          {recState === 'idle' && (
            <>
              <Text fontSize="sm" color="text.secondary">
                Speak for {minSeconds}–{maxSeconds} seconds. You can re-record before submitting.
              </Text>
              <Button onClick={startRecording}>
                <Mic size={16} /> Start recording
              </Button>
            </>
          )}

          {recState === 'recording' && (
            <>
              <Flex align="center" gap="10px">
                <Box w="10px" h="10px" borderRadius="full" bg="red.500"
                  animation="pulse 1.2s ease-in-out infinite" />
                <Text fontSize="2xl" fontWeight="semibold" fontFamily="mono">
                  {fmt(seconds)}
                </Text>
                <Text fontSize="sm" color="text.tertiary">/ {fmt(maxSeconds)}</Text>
              </Flex>

              {/* живой индикатор громкости — высоту полос двигает RAF напрямую */}
              <Flex align="center" justify="center" gap="3px" h="56px" w="100%" maxW="320px">
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <Box
                    key={i}
                    ref={(el: HTMLDivElement | null) => { barsRef.current[i] = el }}
                    w="5px"
                    flexShrink={0}
                    h="5px"
                    borderRadius="full"
                    bg="accent.solid"
                    opacity={0.45}
                    transition="height 20ms linear"
                  />
                ))}
              </Flex>

              <Button variant="secondary" onClick={stopRecording} disabled={seconds < 2}>
                <Square size={15} /> Stop
              </Button>
            </>
          )}

          {(recState === 'recorded' || recState === 'uploading') && localUrl && (
            <>
              <AudioPlayer src={localUrl} />
              {seconds < minSeconds && (
                <Text fontSize="xs" color="text.tertiary">
                  Heads up: shorter than the suggested {minSeconds}s minimum.
                </Text>
              )}
              <Flex gap="10px">
                <Button variant="ghost" size="sm" onClick={reset} disabled={recState === 'uploading'}>
                  <RotateCcw size={14} /> Re-record
                </Button>
                <Button size="sm" onClick={upload} loading={recState === 'uploading'}>
                  <CloudUpload size={15} /> Use this recording
                </Button>
              </Flex>
            </>
          )}

          {recState === 'uploaded' && (
            <>
              <Flex align="center" gap="8px" color="accent.text">
                <Check size={18} />
                <Text fontSize="sm" fontWeight="medium">Recording attached</Text>
              </Flex>
              {localUrl && <AudioPlayer src={localUrl} />}
              {status === 'pending' && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw size={14} /> Record again
                </Button>
              )}
            </>
          )}
        </Stack>
      </Card>

      <Text fontSize="xs" color="text.tertiary">
        AI evaluates content, grammar and fluency of your answer — it does not
        perform instrumental phoneme-level pronunciation analysis.
      </Text>
    </Stack>
  )
}

// Конвертация записи (webm/mp4) в WAV mono 16kHz через Web Audio API.
// Нужно, потому что Gemini не декодирует webm — без этого AI «выдумывает» ответ.
async function blobToWav(blob: Blob): Promise<Blob> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const arrayBuffer = await blob.arrayBuffer()
  const decodeCtx = new AudioCtx()
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0))
  void decodeCtx.close()

  const targetRate = 16000 // достаточно для распознавания речи, файл меньше
  const length = Math.ceil((decoded.duration * targetRate))
  const offline = new OfflineAudioContext(1, length, targetRate)
  const src = offline.createBufferSource()
  src.buffer = decoded
  src.connect(offline.destination)
  src.start()
  const rendered = await offline.startRendering()

  return encodeWav(rendered.getChannelData(0), targetRate)
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
