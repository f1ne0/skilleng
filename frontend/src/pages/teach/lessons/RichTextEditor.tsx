import { useEffect, useRef } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { NativeButton } from '@shared/ui'

/**
 * Простой WYSIWYG-редактор (как в офисных программах): форматирование видно
 * прямо в поле. Учителю не нужно знать markdown.
 *
 * Хранит и отдаёт обычный markdown (## заголовок, **жирный**, - список),
 * чтобы плеер урока и студенческий рендер работали без изменений.
 */
export function RichTextEditor({
  initialMarkdown,
  onChange,
}: {
  initialMarkdown: string
  onChange: (markdown: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Заполняем редактор один раз при монтировании (контролируемый innerHTML
  // ломал бы позицию курсора на каждый ввод).
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = markdownToHtml(initialMarkdown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => {
    if (ref.current) onChange(htmlToMarkdown(ref.current))
  }

  const exec = (command: string, value?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, value)
    emit()
  }

  // Блочные кнопки (Title, Example) работают как переключатель:
  // если строка уже этого типа — возвращаем обычный абзац.
  const toggleBlock = (tag: string) => {
    ref.current?.focus()
    const sel = window.getSelection()
    let node: Node | null = sel?.anchorNode ?? null
    while (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode
    let block = node as HTMLElement | null
    while (block && block.parentElement && block.parentElement !== ref.current) {
      block = block.parentElement
    }
    const current = block?.tagName?.toLowerCase()
    document.execCommand('formatBlock', false, current === tag ? 'p' : tag)
    emit()
  }

  return (
    <Box>
      <Flex
        gap="6px"
        p="6px"
        border="1px solid"
        borderColor="border.default"
        borderBottom="none"
        borderTopRadius="10px"
        bg="bg.subtle"
        wrap="wrap"
      >
        <ToolBtn onClick={() => exec('undo')} title="Undo">Undo</ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Redo">Redo</ToolBtn>
        <Box w="1px" alignSelf="stretch" my="2px" bg="border.default" />
        <ToolBtn onClick={() => toggleBlock('h2')}>Title</ToolBtn>
        <ToolBtn onClick={() => exec('bold')}>Bold</ToolBtn>
        <ToolBtn onClick={() => exec('insertUnorderedList')}>Bullet point</ToolBtn>
        <ToolBtn onClick={() => toggleBlock('blockquote')}>Example</ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'p')}>Normal text</ToolBtn>
      </Flex>

      <Box
        ref={ref}
        contentEditable
        onInput={emit}
        suppressContentEditableWarning
        css={{
          minHeight: '260px',
          padding: '16px 18px',
          background: 'var(--se-colors-bg-surface)',
          border: '1px solid var(--se-colors-border-default)',
          borderTop: 'none',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
          color: 'var(--se-colors-text-primary)',
          fontSize: '15px',
          lineHeight: 1.6,
          outline: 'none',
          '& h2': {
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            margin: '14px 0 8px',
          },
          '& p': { margin: '0 0 10px' },
          '& ul': { margin: '0 0 10px', paddingLeft: '22px', listStyleType: 'disc' },
          '& li': { marginBottom: '4px' },
          '& blockquote': {
            margin: '0 0 10px',
            paddingLeft: '14px',
            borderLeft: '3px solid var(--se-colors-accent-solid)',
            color: 'var(--se-colors-text-secondary)',
            fontStyle: 'italic',
          },
          '& strong, & b': { fontWeight: 600 },
          '&:empty::before': {
            content: '"Type your lesson here. Use the buttons above to add a title, bold a word, or make a list."',
            color: 'var(--se-colors-text-tertiary)',
          },
        }}
      />
    </Box>
  )
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <NativeButton
      // onMouseDown с preventDefault — иначе клик снимает выделение в редакторе
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      type="button"
      title={title}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      h="30px"
      px="14px"
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="md"
      fontSize="sm"
      fontWeight="medium"
      color="text.secondary"
      cursor="pointer"
      _hover={{ borderColor: 'border.accent', color: 'text.primary' }}
    >
      {children}
    </NativeButton>
  )
}

// ===== markdown <-> HTML =====

/** Инлайн-разметка одной строки/элемента: **жирный**, _курсив_ */
function inlineToMarkdown(node: Node): string {
  let out = ''
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? ''
      return
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return
    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()
    const inner = inlineToMarkdown(el)
    if (tag === 'strong' || tag === 'b') out += `**${inner}**`
    else if (tag === 'em' || tag === 'i') out += `_${inner}_`
    else if (tag === 'br') out += '\n'
    else out += inner
  })
  return out
}

/** Весь редактор -> markdown */
function htmlToMarkdown(root: HTMLElement): string {
  const blocks: string[] = []
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent ?? '').trim()
      if (t) blocks.push(t)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'h1') blocks.push(`# ${inlineToMarkdown(el).trim()}`)
    else if (tag === 'h2') blocks.push(`## ${inlineToMarkdown(el).trim()}`)
    else if (tag === 'h3') blocks.push(`### ${inlineToMarkdown(el).trim()}`)
    else if (tag === 'ul' || tag === 'ol') {
      el.querySelectorAll(':scope > li').forEach((li) => {
        blocks.push(`- ${inlineToMarkdown(li).trim()}`)
      })
    } else if (tag === 'blockquote') {
      blocks.push(`> ${inlineToMarkdown(el).trim()}`)
    } else {
      const md = inlineToMarkdown(el).trim()
      if (md) blocks.push(md)
    }
  })
  // списки идут подряд без пустой строки, остальное — через пустую строку
  return joinBlocks(blocks)
}

function joinBlocks(blocks: string[]): string {
  let out = ''
  blocks.forEach((b, i) => {
    if (i === 0) {
      out = b
      return
    }
    const prevList = blocks[i - 1]!.startsWith('- ')
    const curList = b.startsWith('- ')
    out += prevList && curList ? `\n${b}` : `\n\n${b}`
  })
  return out
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Инлайн markdown -> HTML */
function inlineToHtml(text: string): string {
  let html = escapeHtml(text)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // одиночная *звёздочка* и _подчёркивание_ → курсив
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  html = html.replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>')
  return html
}

/** markdown -> HTML для начального наполнения редактора */
function markdownToHtml(md: string): string {
  if (!md.trim()) return ''
  const lines = md.split('\n')
  const out: string[] = []
  let listItems: string[] = []
  let para: string[] = []
  let quote: string[] = []

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${para.map(inlineToHtml).join('<br>')}</p>`)
      para = []
    }
  }
  const flushList = () => {
    if (listItems.length) {
      out.push(`<ul>${listItems.map((i) => `<li>${inlineToHtml(i)}</li>`).join('')}</ul>`)
      listItems = []
    }
  }
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote>${quote.map(inlineToHtml).join('<br>')}</blockquote>`)
      quote = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (line === '') {
      flushPara()
      flushList()
      flushQuote()
      continue
    }
    if (heading) {
      flushPara()
      flushList()
      flushQuote()
      const level = heading[1]!.length
      out.push(`<h${level}>${inlineToHtml(heading[2]!)}</h${level}>`)
      continue
    }
    if (/^>\s?/.test(line)) {
      flushPara()
      flushList()
      quote.push(line.replace(/^>\s?/, ''))
      continue
    }
    if (/^[-*•]\s+/.test(line)) {
      flushPara()
      flushQuote()
      listItems.push(line.replace(/^[-*•]\s+/, ''))
      continue
    }
    flushList()
    flushQuote()
    para.push(line)
  }
  flushPara()
  flushList()
  flushQuote()
  return out.join('')
}
