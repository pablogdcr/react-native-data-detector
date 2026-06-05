/**
 * The type of entity detected in the text.
 */
export type DetectionType = 'phoneNumber' | 'link' | 'email' | 'address' | 'date';

/**
 * A language model supported by ML Kit Entity Extraction on Android, expressed as
 * an ISO 639-1 code. Selects which on-device model is used for detection.
 *
 * Ignored on iOS — `NSDataDetector` is language-agnostic and needs no model.
 */
export type ModelLanguage =
  | 'ar' // Arabic
  | 'nl' // Dutch
  | 'en' // English
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'pl' // Polish
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'es' // Spanish
  | 'th' // Thai
  | 'tr' // Turkish
  | 'zh'; // Chinese

/**
 * The download state of a detection model.
 *
 * - `notDownloaded` — the model is not available on the device yet (Android only).
 * - `downloading` — a download is currently in progress. Only reported by the
 *   {@link useDataDetector} hook while it drives a download; native status queries
 *   never return this.
 * - `ready` — the model is available and `detect()` can run offline. iOS always
 *   reports `ready` since `NSDataDetector` requires no model.
 * - `error` — the last preparation attempt failed. Only reported by the hook.
 */
export type ModelStatus = 'notDownloaded' | 'downloading' | 'ready' | 'error';

/**
 * Options that select which language model a model operation targets.
 */
export interface ModelOptions {
  /**
   * Which language model to target (Android only, defaults to `'en'`).
   * Ignored on iOS.
   */
  language?: ModelLanguage;
}

/**
 * A single detected entity within the text.
 */
export interface DetectedEntity {
  /** The type of detected entity. */
  type: DetectionType;
  /** The matched text substring. */
  text: string;
  /** Start index of the match in the original string. */
  start: number;
  /** End index (exclusive) of the match in the original string. */
  end: number;
  /** Additional data depending on the type (e.g., URL string, phone number, date ISO string). */
  data?: Record<string, string>;
}

/**
 * Options for the detect function.
 */
export interface DetectOptions {
  /** Which entity types to detect. Defaults to all types. */
  types?: DetectionType[];
  /**
   * Which language model to use (Android only, defaults to `'en'`).
   * Ignored on iOS.
   */
  language?: ModelLanguage;
}
