import { useMemo, useState } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Plus, Search, Trash2, MessageSquare, Pencil, Check, X } from 'lucide-react'
import { Input, NativeButton, NativeInput, Skeleton } from '@shared/ui'
import { useChatStore } from '../store'
import { useConversationsList, useDeleteConversation, useRenameConversation } from '../hooks'
import type { Conversation } from '../types'

interface Bucket {
  key: string
  label: string
  items: Conversation[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function bucketize(items: Conversation[]): Bucket[] {
  const now = Date.now()
  const today: Conversation[] = []
  const yesterday: Conversation[] = []
  const lastWeek: Conversation[] = []
  const older: Conversation[] = []

  const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt)
  for (const c of sorted) {
    const ageMs = now - c.updatedAt
    if (ageMs < DAY_MS) today.push(c)
    else if (ageMs < 2 * DAY_MS) yesterday.push(c)
    else if (ageMs < 7 * DAY_MS) lastWeek.push(c)
    else older.push(c)
  }

  return [
    { key: 'today',     label: 'Today',     items: today     },
    { key: 'yesterday', label: 'Yesterday', items: yesterday },
    { key: 'lastWeek',  label: 'Last 7 days', items: lastWeek },
    { key: 'older',     label: 'Older',     items: older     },
  ].filter((b) => b.items.length > 0)
}

export function ConversationList() {
  const activeId = useChatStore((s) => s.activeId)
  const select = useChatStore((s) => s.selectConversation)

  const listQuery = useConversationsList()
  const deleteMutation = useDeleteConversation()
  const renameMutation = useRenameConversation()

  const [query, setQuery] = useState('')

  const buckets = useMemo(() => {
    const items = listQuery.data ?? []
    const q = query.trim().toLowerCase()
    const filtered = q
      ? items.filter((c) => c.title.toLowerCase().includes(q))
      : items
    return bucketize(filtered)
  }, [listQuery.data, query])

  return (
    <Flex direction="column" h="100%" gap="12px">
      <NativeButton
        type="button"
        onClick={() => select(null)}
        display="flex"
        alignItems="center"
        gap="8px"
        h="40px"
        px="14px"
        bg="accent.solid"
        color="text.onAccent"
        border="none"
        borderRadius="lg"
        fontWeight="medium"
        fontSize="sm"
        fontFamily="body"
        cursor="pointer"
        transition="background 150ms, transform 80ms"
        _hover={{ bg: 'accent.solidHover' }}
        _active={{ transform: 'scale(0.98)' }}
      >
        <Plus size={14} strokeWidth={2.4} />
        New conversation
      </NativeButton>

      <Input
        placeholder="Search chats…"
        leftIcon={<Search size={14} />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="md"
      />

      <Box flex="1" overflowY="auto" mx="-8px" px="8px">
        {listQuery.isLoading ? (
          <Stack gap="6px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} h="36px" borderRadius="md" />
            ))}
          </Stack>
        ) : buckets.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="40px"
            color="text.tertiary"
            gap="8px"
            textAlign="center"
          >
            <MessageSquare size={24} />
            <Text fontSize="sm">No conversations yet.</Text>
          </Flex>
        ) : (
          <Stack gap="18px">
            {buckets.map((b) => (
              <Box key={b.key}>
                <Text
                  fontSize="xs"
                  color="text.tertiary"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  fontWeight="medium"
                  mb="6px"
                  px="4px"
                >
                  {b.label}
                </Text>
                <Stack gap="2px">
                  {b.items.map((conv) => (
                    <ConvRow
                      key={conv.id}
                      conv={conv}
                      active={conv.id === activeId}
                      onSelect={() => select(conv.id)}
                      onDelete={() => deleteMutation.mutate(conv.id)}
                      onRename={(title) => renameMutation.mutate({ id: conv.id, title })}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Flex>
  )
}

function ConvRow({
  conv, active, onSelect, onDelete, onRename,
}: {
  conv: Conversation
  active: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
}) {
  const [hover, setHover] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(conv.title)

  const commit = () => {
    const t = value.trim()
    if (t && t !== conv.title) onRename(t)
    setEditing(false)
  }

  if (editing) {
    return (
      <Flex align="center" gap="6px" h="36px" px="8px" borderRadius="md" bg="bg.subtle">
        <NativeInput
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setValue(conv.title); setEditing(false) }
          }}
          flex="1"
          h="28px"
          px="8px"
          bg="bg.surface"
          border="1px solid"
          borderColor="border.default"
          borderRadius="sm"
          fontSize="sm"
          color="text.primary"
          outline="none"
        />
        <RowIcon label="Save" onClick={commit}><Check size={13} /></RowIcon>
        <RowIcon label="Cancel" onClick={() => { setValue(conv.title); setEditing(false) }}><X size={13} /></RowIcon>
      </Flex>
    )
  }

  return (
    <Flex
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      align="center"
      gap="4px"
      h="36px"
      px="10px"
      borderRadius="md"
      bg={active ? 'accent.surface' : 'transparent'}
      color={active ? 'accent.text' : 'text.secondary'}
      fontSize="sm"
      cursor="pointer"
      transition="background 120ms, color 120ms"
      _hover={active ? undefined : { bg: 'bg.subtle', color: 'text.primary' }}
    >
      <Text flex="1" lineHeight="tight" truncate>
        {conv.title}
      </Text>
      {(hover || active) && (
        <>
          <RowIcon label="Rename" onClick={(e) => { e.stopPropagation(); setValue(conv.title); setEditing(true) }}>
            <Pencil size={12} />
          </RowIcon>
          <RowIcon label="Delete" tone="error" onClick={(e) => { e.stopPropagation(); onDelete() }}>
            <Trash2 size={12} />
          </RowIcon>
        </>
      )}
    </Flex>
  )
}

function RowIcon({
  children, onClick, label, tone,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  label: string
  tone?: 'error'
}) {
  return (
    <NativeButton
      type="button" aria-label={label} title={label} onClick={onClick}
      display="inline-flex" alignItems="center" justifyContent="center"
      w="22px" h="22px" bg="transparent" border="none" borderRadius="sm"
      color="text.tertiary" cursor="pointer" flexShrink={0}
      _hover={tone === 'error'
        ? { color: 'error', bg: 'rgba(244,63,94,0.10)' }
        : { color: 'text.primary', bg: 'bg.elevated' }}
    >
      {children}
    </NativeButton>
  )
}
