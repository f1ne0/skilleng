import { useState } from 'react'
import { Box, Flex, Text, chakra } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ChakraButton = chakra('button')

interface Props {
  /** Выбранная дата YYYY-MM-DD или null */
  value: string | null
  onChange: (value: string) => void
  /** Минимальная дата YYYY-MM-DD (раньше — недоступно) */
  min?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Кастомный календарь — в стиле приложения, без нативного date-input. */
export function DatePicker({ value, onChange, min }: Props) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date()
  const [view, setView] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))

  const year = view.getFullYear()
  const month = view.getMonth()

  // понедельник-первый: смещение первого дня месяца
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = ymd(new Date())
  const minStr = min ?? todayStr

  const monthLabel = view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <Box
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.subtle"
      p="14px"
      w="100%"
      maxW="300px"
    >
      {/* шапка */}
      <Flex align="center" justify="space-between" mb="10px">
        <NavBtn onClick={() => setView(new Date(year, month - 1, 1))} label="Previous month">
          <ChevronLeft size={16} />
        </NavBtn>
        <Text fontSize="sm" fontWeight="semibold" textTransform="capitalize">
          {monthLabel}
        </Text>
        <NavBtn onClick={() => setView(new Date(year, month + 1, 1))} label="Next month">
          <ChevronRight size={16} />
        </NavBtn>
      </Flex>

      {/* дни недели */}
      <Flex mb="4px">
        {WEEKDAYS.map((w) => (
          <Box key={w} flex="1" textAlign="center">
            <Text fontSize="2xs" color="text.tertiary" fontWeight="medium" letterSpacing="wide">
              {w}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* сетка дат */}
      <Box>
        {Array.from({ length: cells.length / 7 }).map((_, row) => (
          <Flex key={row} gap="2px" mb="2px">
            {cells.slice(row * 7, row * 7 + 7).map((date, i) => {
              if (!date) return <Box key={i} flex="1" h="34px" />
              const ds = ymd(date)
              const selected = value === ds
              const isToday = ds === todayStr
              const disabled = ds < minStr
              return (
                <ChakraButton
                  key={i}
                  type="button"
                  flex="1"
                  h="34px"
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight={selected ? 'semibold' : 'normal'}
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  opacity={disabled ? 0.3 : 1}
                  color={selected ? 'white' : 'text.primary'}
                  bg={selected ? 'accent.solid' : 'transparent'}
                  border={isToday && !selected ? '1px solid' : '1px solid transparent'}
                  borderColor={isToday && !selected ? 'border.accent' : 'transparent'}
                  transition="background 120ms"
                  _hover={!disabled && !selected ? { bg: 'bg.muted' } : undefined}
                  onClick={() => { if (!disabled) onChange(ds) }}
                  disabled={disabled}
                >
                  {date.getDate()}
                </ChakraButton>
              )
            })}
          </Flex>
        ))}
      </Box>
    </Box>
  )
}

function NavBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <ChakraButton
      type="button"
      onClick={onClick}
      aria-label={label}
      w="30px"
      h="30px"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="text.secondary"
      cursor="pointer"
      _hover={{ bg: 'bg.muted', color: 'text.primary' }}
    >
      {children}
    </ChakraButton>
  )
}
