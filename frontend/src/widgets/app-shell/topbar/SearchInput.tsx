import { useState } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { Search } from 'lucide-react'
import { Input, NativeButton } from '@shared/ui'

function detectMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)
}

export function SearchInput() {
  const [isMac] = useState(detectMac)

  const openPalette = () => window.dispatchEvent(new Event('open-command-palette'))

  return (
    <>
      {/* Телефон: только иконка-кнопка, чтобы не занимать всю ширину */}
      <NativeButton
        type="button"
        onClick={openPalette}
        aria-label="Search"
        display={{ base: 'flex', md: 'none' }}
        alignItems="center"
        justifyContent="center"
        w="40px"
        h="40px"
        flexShrink={0}
        borderRadius="md"
        bg="transparent"
        border="none"
        color="text.secondary"
        cursor="pointer"
        _hover={{ bg: 'bg.subtle', color: 'text.primary' }}
      >
        <Search size={18} />
      </NativeButton>

      {/* Планшет/десктоп: полноценная строка поиска */}
      <Box
        display={{ base: 'none', md: 'block' }}
        w={{ md: '320px', lg: '460px' }}
        maxW="100%"
        cursor="pointer"
        onClick={openPalette}
      >
        <Box pointerEvents="none">
          <Input
            type="text"
            readOnly
            tabIndex={-1}
            placeholder="Search lessons, vocabulary, AI chats…"
            leftIcon={<Search size={16} strokeWidth={2.2} />}
            rightIcon={
              <Flex
                align="center"
                justify="center"
                gap="4px"
                px="8px"
                h="24px"
                minW="34px"
                borderRadius="md"
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.subtle"
                color="text.secondary"
                fontSize="13px"
                fontFamily="mono"
                fontWeight="medium"
                lineHeight="none"
                pointerEvents="none"
              >
                <span>{isMac ? '⌘' : 'Ctrl'}</span>
                <span>K</span>
              </Flex>
            }
          />
        </Box>
      </Box>
    </>
  )
}
