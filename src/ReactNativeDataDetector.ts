import { requireNativeModule } from 'expo-modules-core';

import type {
  DetectedEntity,
  DetectOptions,
  ModelLanguage,
  ModelOptions,
  ModelStatus,
} from './ReactNativeDataDetector.types';

const NativeModule = requireNativeModule('ReactNativeDataDetector');

const DEFAULT_LANGUAGE: ModelLanguage = 'en';
const ALL_TYPES = ['phoneNumber', 'link', 'email', 'address', 'date'] as const;

/**
 * Pre-downloads the entity-detection model for the given language so that
 * `detect()` can run offline afterwards.
 *
 * On Android this downloads the ML Kit model for `language` (~5.6MB) if it is
 * not already cached. On iOS this is a no-op that resolves immediately —
 * `NSDataDetector` is built into the OS and requires no model.
 *
 * @returns `true` once the model is ready.
 */
export async function prepareModel(options?: ModelOptions): Promise<boolean> {
  return NativeModule.prepareModel(options?.language ?? DEFAULT_LANGUAGE);
}

/**
 * Returns the download status of the model for the given language.
 *
 * On Android this reflects whether the ML Kit model is cached on the device
 * (`'ready'` or `'notDownloaded'`). On iOS this always resolves to `'ready'`.
 *
 * A pure status query never returns `'downloading'` or `'error'` — those states
 * are only surfaced by the {@link useDataDetector} hook while it drives a download.
 */
export async function getModelStatus(options?: ModelOptions): Promise<ModelStatus> {
  return NativeModule.getModelStatus(options?.language ?? DEFAULT_LANGUAGE);
}

/**
 * Convenience wrapper around {@link getModelStatus} that resolves `true` when the
 * model for the given language is available and `detect()` can run offline.
 */
export async function isModelReady(options?: ModelOptions): Promise<boolean> {
  return (await getModelStatus(options)) === 'ready';
}

/**
 * Detects entities (phone numbers, URLs, emails, addresses, dates) in the given text
 * using native platform APIs (NSDataDetector on iOS, ML Kit on Android).
 */
export async function detect(text: string, options?: DetectOptions): Promise<DetectedEntity[]> {
  const types = options?.types ?? [...ALL_TYPES];
  return NativeModule.detect(text, types, options?.language ?? DEFAULT_LANGUAGE);
}

/**
 * @deprecated Renamed to {@link prepareModel} in 0.3.0. This alias will be removed
 * in a future major version. `prepareModel` accepts a `{ language }` option;
 * `downloadModel` always targets the default (`'en'`) model.
 */
export async function downloadModel(): Promise<boolean> {
  return prepareModel();
}
