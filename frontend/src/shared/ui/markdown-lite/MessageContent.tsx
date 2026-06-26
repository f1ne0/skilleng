import { Fragment, useState } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { Copy, Check } from 'lucide-react'
import { NativeButton } from '../primitives'

/**
 * Minimal "markdown-lite" renderer — handles enough for the tutor:
 *   **bold**, `code`, > blockquote, • lists, plain paragraphs, blank-line splits.
 * Content comes from the AI tutor; render conservatively (no raw HTML injection).
 *
 * Живёт в shared/ui, потому что используется и в ai-tutor, и в lesson-player —
 * импорт страницы из страницы запрещён в FSD.
 */
export function MessageContent({ text }: { text: string }) {
  const blocks = splitBlocks(text)
  return (
    <Box>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </Box>
  )
}

type BlockNode =
  | { type: 'p'; lines: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; code: string }

function splitBlocks(text: string): BlockNode[] {
  const lines = text.split('\n')
  const blocks: BlockNode[] = []
  let current: BlockNode | null = null

  const flush = () => {
    if (current) blocks.push(current)
    current = null
  }

  // Блоки кода в тройных бэктиках — собираем как есть, без разметки внутри
  let inCode = false
  let codeLines: string[] = []

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.trimStart().startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', code: codeLines.join('\n') })
        codeLines = []
        inCode = false
      } else {
        flush()
        inCode = true
      }
      continue
    }
    if (inCode) {
      codeLines.push(raw)
      continue
    }

    if (line === '') {
      flush()
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flush()
      blocks.push({ type: 'heading', level: heading[1]!.length, text: heading[2]! })
      continue
    }
    if (/^[•\-*]\s+/.test(line)) {
      const item = line.replace(/^[•\-*]\s+/, '')
      if (current?.type === 'list') current.items.push(item)
      else {
        flush()
        current = { type: 'list', items: [item] }
      }
      continue
    }
    if (line.startsWith('> ')) {
      const inner = line.slice(2)
      if (current?.type === 'quote') current.lines.push(inner)
      else {
        flush()
        current = { type: 'quote', lines: [inner] }
      }
      continue
    }
    if (current?.type === 'p') current.lines.push(line)
    else {
      flush()
      current = { type: 'p', lines: [line] }
    }
  }
  // незакрытый блок кода — отдаём что собрали
  if (inCode && codeLines.length > 0) {
    blocks.push({ type: 'code', code: codeLines.join('\n') })
  }
  flush()
  return blocks
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // ignore
    }
  }
  return (
    <Box
      position="relative"
      mb="12px"
      bg="bg.subtle"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="xl"
    >
      <NativeButton
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy'}
        title={copied ? 'Copied' : 'Copy'}
        position="absolute"
        top="8px"
        right="8px"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w="28px"
        h="28px"
        bg="transparent"
        border="none"
        borderRadius="md"
        color={copied ? 'accent.text' : 'text.tertiary'}
        cursor="pointer"
        _hover={{ color: 'text.primary', bg: 'bg.elevated' }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </NativeButton>
      <Box
        as="pre"
        m="0"
        p="14px 16px"
        pr="44px"
        overflowX="auto"
        fontFamily="mono"
        fontSize="sm"
        lineHeight="relaxed"
        color={{ base: 'text.primary', _dark: '#E4E3E0' }}
        whiteSpace="pre"
      >
        {code}
      </Box>
    </Box>
  )
}

function Block({ block }: { block: BlockNode }) {
  switch (block.type) {
    case 'code':
      return <CodeBlock code={block.code} />
    case 'heading': {
      const size = block.level === 1 ? 'xl' : block.level === 2 ? 'lg' : 'md'
      return (
        <Text
          as="p"
          fontSize={size}
          fontWeight="semibold"
          color="text.primary"
          letterSpacing="tight"
          lineHeight="tight"
          mt="8px"
          mb="8px"
        >
          <InlineFormat text={block.text} />
        </Text>
      )
    }
    case 'p':
      return (
        <Text fontSize="md" color="text.primary" lineHeight="relaxed" mb="12px">
          {block.lines.map((l, i) => (
            <Fragment key={i}>
              <InlineFormat text={l} />
              {i < block.lines.length - 1 && <br />}
            </Fragment>
          ))}
        </Text>
      )
    case 'list':
      return (
        <Box as="ul" pl="20px" m="0" mb="12px" listStyleType="disc">
          {block.items.map((item, i) => (
            <Box
              as="li"
              key={i}
              fontSize="md"
              color="text.primary"
              lineHeight="relaxed"
              mb="4px"
            >
              <InlineFormat text={item} />
            </Box>
          ))}
        </Box>
      )
    case 'quote':
      return (
        <Box
          borderLeft="3px solid"
          borderColor="accent.solid"
          pl="14px"
          py="2px"
          mb="12px"
          color="text.secondary"
          fontStyle="italic"
        >
          {block.lines.map((l, i) => (
            <Text key={i} fontSize="md" lineHeight="relaxed">
              <InlineFormat text={l} />
            </Text>
          ))}
        </Box>
      )
  }
}

/**
 * Handles **bold** and `code` inline. Returns an array of React nodes.
 */
function InlineFormat({ text }: { text: string }) {
  const segs: React.ReactNode[] = []
  let i = 0
  let buf = ''

  const flush = () => {
    if (buf) {
      segs.push(buf)
      buf = ''
    }
  }

  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        flush()
        segs.push(
          <Text as="strong" key={`b-${i}`} fontWeight="semibold" color="text.primary">
            {text.slice(i + 2, end)}
          </Text>,
        )
        i = end + 2
        continue
      }
    }
    if (text[i] === '*') {
      // одиночная *звёздочка* → курсив (двойную перехватывает блок выше)
      const end = text.indexOf('*', i + 1)
      if (end !== -1 && end - i > 1) {
        flush()
        segs.push(
          <Text as="em" key={`ia-${i}`} fontStyle="italic" color="text.secondary">
            {text.slice(i + 1, end)}
          </Text>,
        )
        i = end + 1
        continue
      }
    }
    if (text[i] === '_') {
      const end = text.indexOf('_', i + 1)
      if (end !== -1 && end - i > 1) {
        flush()
        segs.push(
          <Text as="em" key={`i-${i}`} fontStyle="italic" color="text.secondary">
            {text.slice(i + 1, end)}
          </Text>,
        )
        i = end + 1
        continue
      }
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        flush()
        segs.push(
          <Text
            as="code"
            key={`c-${i}`}
            fontFamily="mono"
            fontSize="sm"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="sm"
            px="4px"
            py="1px"
          >
            {text.slice(i + 1, end)}
          </Text>,
        )
        i = end + 1
        continue
      }
    }
    buf += text[i]
    i++
  }
  flush()
  return <>{segs}</>
}
