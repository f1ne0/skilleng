import { useState } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Copy, ThumbsUp, ThumbsDown, Check, Sparkles } from 'lucide-react'
import { MessageContent, NativeButton, showToast } from '@shared/ui'
import { useChatStore } from '../store'
import type { ChatMessage } from '../types'

/**
 * Современная раскладка в духе AI-агентов:
 * - сообщение юзера — компактный пузырь справа, без аватара и имени;
 * - ответ ассистента — чистый текст во всю колонку, без обвязки;
 * - действия (copy/like) проявляются при наведении под ответом.
 */
export function Message({ message }: { message: ChatMessage; conversationId?: string }) {
  const reaction = useChatStore((s) => s.reactions[message.id] ?? null)
  const setReaction = useChatStore((s) => s.setReaction)
  const [copied, setCopied] = useState(false)
  const [hover, setHover] = useState(false)

  const isUser = message.role === 'user'
  const isPending = message.role === 'assistant' && message.content === ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      showToast({ type: 'error', title: 'Could not copy' })
    }
  }

  const liked = reaction === 'like'
  const disliked = reaction === 'dislike'
  const setLiked = () => setReaction(message.id, liked ? null : 'like')
  const setDisliked = () => setReaction(message.id, disliked ? null : 'dislike')

  // ===== Пузырь юзера справа =====
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      >
        <Flex justify="flex-end" py="10px">
          <Box
            maxW="78%"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="2xl"
            borderBottomRightRadius="md"
            px="16px"
            py="10px"
            fontSize="md"
            lineHeight="relaxed"
            color="text.primary"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {message.content}
          </Box>
        </Flex>
      </motion.div>
    )
  }

  // ===== Ответ ассистента: чистый текст =====
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Box py="10px">
        {isPending ? (
          <ThinkingBurst />
        ) : (
          <>
            <MessageContent text={message.content} />

            {/* действия — проявляются при наведении, место зарезервировано */}
            <Flex
              gap="2px"
              align="center"
              mt="2px"
              opacity={hover || copied || liked || disliked ? 1 : 0}
              transition="opacity 150ms"
            >
              <ActionButton
                label={copied ? 'Copied' : 'Copy'}
                onClick={handleCopy}
                icon={copied ? <Check size={13} /> : <Copy size={13} />}
                active={copied}
              />
              <ActionButton
                label="Helpful"
                onClick={setLiked}
                icon={<ThumbsUp size={13} />}
                active={liked}
              />
              <ActionButton
                label="Not helpful"
                onClick={setDisliked}
                icon={<ThumbsDown size={13} />}
                active={disliked}
              />
            </Flex>
          </>
        )}
      </Box>
    </motion.div>
  )
}

function ActionButton({
  label, onClick, icon, active,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <NativeButton
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      gap="6px"
      h="28px"
      px="8px"
      bg={active ? 'accent.surface' : 'transparent'}
      border="1px solid"
      borderColor={active ? 'border.accent' : 'transparent'}
      borderRadius="md"
      color={active ? 'accent.text' : 'text.tertiary'}
      cursor="pointer"
      fontSize="xs"
      fontFamily="body"
      transition="background 120ms, color 120ms, border-color 120ms"
      _hover={{ bg: 'bg.subtle', color: 'text.secondary' }}
    >
      {icon}
    </NativeButton>
  )
}

/** Индикатор "Thinking…": три пульсирующие точки на чистом CSS (всегда анимируется) */
function ThinkingBurst() {
  return (
    <Flex align="center" gap="10px" py="6px">
      <span className="se-spark" aria-hidden>
        <Sparkles size={18} strokeWidth={2.4} />
      </span>
      <Box as="span" fontSize="sm" color="text.secondary">Thinking…</Box>
    </Flex>
  )
}
