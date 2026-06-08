import type { DetectionType } from 'react-native-data-detector';

export const TYPE_COLORS: Record<DetectionType, string> = {
  phoneNumber: '#A78BFA',
  link: '#60A5FA',
  email: '#34D399',
  address: '#FBBF24',
  date: '#F472B6',
};

export const TYPE_GLYPHS: Record<DetectionType, string> = {
  phoneNumber: '☎',
  link: '🔗',
  email: '✉',
  address: '📍',
  date: '📅',
};

// Short enough to fit one screen, hits every supported entity type once.
export const DEMO_SCRIPT =
  "Tomorrow, I'll be at 1 Infinite Loop.  Give me a call at (555) 123-4567, or email john@example.com. You can check the details at example.com";

export const AUTO_TYPE_INTERVAL_MS = 42;
export const AUTO_TYPE_PUNCTUATION_PAUSE_MS = 52;

// grace period before a fresh match gets its grey highlight, so it doesn't flash in
export const APPEAR_DELAY_MS = 150;

// how long a value must hold unchanged before the pill becomes a chip
export const SETTLE_MS = 200;

// throttle, not debounce: a trailing debounce never fires during continuous typing
export const DETECT_THROTTLE_MS = 200;
