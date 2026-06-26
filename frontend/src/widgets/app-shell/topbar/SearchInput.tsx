import { useState } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { Search } from 'lucide-react'
import { Input } from '@shared/ui'

function detectMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)
}

export function SearchInput() {
  const [isMac] = useState(detectMac)

  const openPalette = () => window.dispatchEvent(new Event('open-command-palette'))

  return (
    <Box
      w={{ base: '220px', md: '380px', lg: '460px' }}
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
  )
}
