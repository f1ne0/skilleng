import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Play, Pause } from 'lucide-react'

interface Props {
  src: string
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/** Компактный кастомный аудиоплеер — приятнее дефолтных браузерных контролов. */
export function AudioPlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hover, setHover] = useState(false)

  // плавное обновление прогресса (60fps) — timeupdate срабатывает рывками
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }
    const loop = () => {
      const audio = audioRef.current
      if (audio) setCurrent(audio.currentTime)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [playing])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => {
      setPlaying(false)
      setCurrent(0)
    }
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended', onEnd)
    }
  }, [src])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      void audio.play()
      setPlaying(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
    setCurrent(audio.currentTime)
  }

  const pct = duration ? (current / duration) * 100 : 0

  return (
    <Flex
      align="center"
      gap="16px"
      w="100%"
      maxW="460px"
      bg={{ base: '#FFFFFF', _dark: 'bg.subtle' }}
      border="1px solid"
      borderColor={{ base: '#E6E3DD', _dark: 'border.subtle' }}
      borderRadius="full"
      px="16px"
      py="12px"
      boxShadow="0 1px 2px rgba(15,23,42,0.04)"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <Box
        as="button"
        onClick={toggle}
        flexShrink={0}
        w="42px"
        h="42px"
        borderRadius="full"
        bg="accent.solid"
        color="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        boxShadow="0 2px 8px rgba(16,185,129,0.35)"
        transition="transform 150ms cubic-bezier(0.34,1.56,0.64,1), filter 150ms, box-shadow 150ms"
        _hover={{ filter: 'brightness(1.06)', boxShadow: '0 4px 14px rgba(16,185,129,0.45)' }}
        _active={{ transform: 'scale(0.9)' }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
        )}
      </Box>

      <Box
        flex="1"
        py="8px"
        cursor="pointer"
        position="relative"
        onClick={seek}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        role="slider"
        aria-label="Seek"
      >
        <Box
          h={hover ? '7px' : '5px'}
          bg={{ base: '#ECE9E3', _dark: 'bg.muted' }}
          borderRadius="full"
          position="relative"
          transition="height 150ms ease"
        >
          <Box
            position="absolute"
            top="0"
            left="0"
            h="100%"
            w={`${pct}%`}
            borderRadius="full"
            background="linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))"
            style={{ transition: playing ? 'none' : 'width 120ms ease' }}
          />
          <Box
            position="absolute"
            top="50%"
            left={`${pct}%`}
            transform="translate(-50%, -50%)"
            w={hover || playing ? '14px' : '0px'}
            h={hover || playing ? '14px' : '0px'}
            borderRadius="full"
            bg="white"
            border="2px solid"
            borderColor="accent.solid"
            boxShadow="0 1px 4px rgba(0,0,0,0.25)"
            pointerEvents="none"
            transition="width 150ms ease, height 150ms ease"
          />
        </Box>
      </Box>

      <Text
        fontSize="xs"
        color="text.tertiary"
        fontFamily="mono"
        flexShrink={0}
        minW="78px"
        textAlign="right"
        letterSpacing="tight"
      >
        {fmt(current)} / {fmt(duration)}
      </Text>
    </Flex>
  )
}
