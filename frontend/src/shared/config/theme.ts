import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

/**
 * SkillEng design system — Chakra v3.
 * Dark mode is default; semantic tokens flip via `_dark`.
 */

const config = defineConfig({
  cssVarsPrefix: 'se',
  globalCss: {
    'html, body, #root': {
      height: '100%',
      background: 'bg.canvas',
      color: 'text.primary',
      fontFamily: 'body',
      fontSize: 'md',
      lineHeight: 'relaxed',
    },
    '*': { borderColor: 'border.subtle' },
    '*:focus-visible': { outline: 'none' },
    '::selection': { background: 'accent.surfaceHover', color: 'accent.text' },
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, sans-serif' },
        heading: { value: '"Inter Variable", "Inter", -apple-system, sans-serif' },
        mono: { value: '"JetBrains Mono", "SF Mono", Consolas, monospace' },
      },
      fontSizes: {
        xs: { value: '12px' },
        sm: { value: '13px' },
        md: { value: '14px' },
        lg: { value: '16px' },
        xl: { value: '18px' },
        '2xl': { value: '20px' },
        '3xl': { value: '24px' },
        '4xl': { value: '32px' },
        '5xl': { value: '48px' },
      },
      fontWeights: {
        normal: { value: '400' },
        medium: { value: '500' },
        semibold: { value: '600' },
      },
      lineHeights: {
        none: { value: '1' },
        tight: { value: '1.25' },
        normal: { value: '1.5' },
        relaxed: { value: '1.625' },
      },
      letterSpacings: {
        tight: { value: '-0.02em' },
        normal: { value: '0' },
        wide: { value: '0.02em' },
      },
      radii: {
        none: { value: '0' },
        sm: { value: '4px' },
        md: { value: '6px' },
        lg: { value: '8px' },
        xl: { value: '12px' },
        '2xl': { value: '16px' },
        full: { value: '9999px' },
      },
      colors: {
        // Raw palette (dark + light values live in semanticTokens below)
        emerald: {
          400: { value: '#34D399' },
          500: { value: '#10B981' },
          600: { value: '#059669' },
          700: { value: '#047857' },
          800: { value: '#065F46' },
          300: { value: '#6EE7B7' },
        },
        rose:    { 500: { value: '#F43F5E' } },
        amber:   { 500: { value: '#F59E0B' } },
        blue:    { 500: { value: '#3B82F6' } },
        stone: {
          50:  { value: '#FAFAF9' },
          100: { value: '#F5F5F4' },
          200: { value: '#E7E5E4' },
          300: { value: '#D6D3D1' },
          400: { value: '#A8A29E' },
          500: { value: '#78716C' },
          600: { value: '#57534E' },
          700: { value: '#44403C' },
          800: { value: '#1C1917' },
          900: { value: '#0F0F0F' },
          950: { value: '#0A0A0A' },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          canvas:   { value: { base: '#F3F1ED',  _dark: '#0A0A0A' } },
          surface:  { value: { base: '#FFFFFF',  _dark: '#131313' } },
          elevated: { value: { base: '#FFFFFF',  _dark: '#1A1A1A' } },
          subtle:   { value: { base: '#EBE9E4',  _dark: '#1F1F1F' } },
          muted:    { value: { base: '#DDD9D3',  _dark: '#262626' } },
        },
        text: {
          primary:   { value: { base: '#1C1917', _dark: '#FAFAF9' } },
          secondary: { value: { base: '#44403C', _dark: '#A8A29E' } },
          tertiary:  { value: { base: '#78716C', _dark: '#78716C' } },
          disabled:  { value: { base: '#A8A29E', _dark: '#44403C' } },
          onAccent:  { value: { base: '#FFFFFF', _dark: '#FFFFFF' } },
        },
        border: {
          subtle:  { value: { base: '#DAD6CF',                _dark: 'rgba(255,255,255,0.06)' } },
          default: { value: { base: '#C2BDB5',                _dark: 'rgba(255,255,255,0.10)' } },
          strong:  { value: { base: '#9C968D',                _dark: 'rgba(255,255,255,0.16)' } },
          accent:  { value: { base: 'rgba(5,150,105,0.30)',   _dark: 'rgba(16,185,129,0.30)' } },
        },
        accent: {
          solid:        { value: { base: '#059669',                _dark: '#10B981' } },
          solidHover:   { value: { base: '#047857',                _dark: '#34D399' } },
          solidActive:  { value: { base: '#065F46',                _dark: '#6EE7B7' } },
          surface:      { value: { base: '#ECFDF5',                _dark: 'rgba(16,185,129,0.10)' } },
          surfaceHover: { value: { base: '#D1FAE5',                _dark: 'rgba(16,185,129,0.16)' } },
          text:         { value: { base: '#047857',                _dark: '#34D399' } },
        },
        success: { value: { base: '#059669', _dark: '#10B981' } },
        warning: { value: { base: '#D97706', _dark: '#F59E0B' } },
        error:   { value: { base: '#E11D48', _dark: '#F43F5E' } },
        info:    { value: { base: '#2563EB', _dark: '#3B82F6' } },
      },
      shadows: {
        xs: { value: '0 1px 2px rgba(0,0,0,0.04)' },
        sm: { value: '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' },
        md: { value: { base: '0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)', _dark: '0 4px 12px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.30)' } },
        lg: { value: { base: '0 12px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)', _dark: '0 16px 32px rgba(0,0,0,0.50), 0 4px 8px rgba(0,0,0,0.30)' } },
        xl: { value: { base: '0 24px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)', _dark: '0 24px 48px rgba(0,0,0,0.60), 0 8px 16px rgba(0,0,0,0.40)' } },
        focus: { value: '0 0 0 3px rgba(16,185,129,0.30)' },
        focusError: { value: '0 0 0 3px rgba(244,63,94,0.20)' },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)

export const AUTH_GRADIENT =
  'radial-gradient(ellipse at top, rgba(16,185,129,0.15), transparent 60%), ' +
  'radial-gradient(ellipse at bottom right, rgba(59,130,246,0.10), transparent 50%)'
