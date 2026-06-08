export const C = {
  bg: '#0B0C10',
  surfaceHi: '#1E2128',
  border: 'rgba(255,255,255,0.08)',
  text: '#F4F4F6',
  muted: '#8B8D98',
  settling: 'rgba(255,255,255,0.10)',
  accent: '#6366F1',
} as const;

export const TYPO = {
  fontSize: 18,
  // keep comfortably above chipHeight so chips on adjacent lines don't touch
  lineHeight: 32,
  fontWeight: '600' as const,
  chipHeight: 26,
} as const;

export const SCREEN_PADDING = 20;
