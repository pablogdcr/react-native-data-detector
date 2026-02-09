import { requireNativeModule } from 'expo-modules-core';

import type { DetectedEntity, DetectOptions } from './ReactNativeDataDetector.types';

const NativeModule = requireNativeModule('ReactNativeDataDetector');

/**
 * Pre-downloads the ML Kit entity extraction model on Android.
 * No-op on iOS (NSDataDetector requires no model download).
 * Call this at app startup to ensure `detect()` works offline later.
 */
export async function downloadModel(): Promise<boolean> {
  return NativeModule.downloadModel();
}

/**
 * Detects entities (phone numbers, URLs, emails, addresses, dates) in the given text
 * using native platform APIs (NSDataDetector on iOS, ML Kit on Android).
 */
export async function detect(
  text: string,
  options?: DetectOptions
): Promise<DetectedEntity[]> {
  const types = options?.types ?? ['phoneNumber', 'link', 'email', 'address', 'date'];
  return NativeModule.detect(text, types);
}
