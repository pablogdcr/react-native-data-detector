import type { DetectionType, ModelLanguage } from 'react-native-data-detector';

export const SAMPLE_TEXT =
  'Call me at (555) 123-4567 or email john@example.com tomorrow at 9:30pm.';

export const TYPE_COLORS: Record<DetectionType, string> = {
  phoneNumber: '#A78BFA',
  link: '#60A5FA',
  email: '#34D399',
  address: '#FBBF24',
  date: '#F472B6',
};

export const TYPE_LABELS: Record<DetectionType, string> = {
  phoneNumber: 'Phone',
  link: 'Link',
  email: 'Email',
  address: 'Address',
  date: 'Date',
};

/** The 15 language models supported by ML Kit Entity Extraction (Android). */
export const LANGUAGES: { code: ModelLanguage; name: string }[] = [
  { code: 'ar', name: 'Arabic' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'zh', name: 'Chinese' },
];
