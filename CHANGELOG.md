# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `useDetectedEntities(text, options?)` hook — reactive, debounced detection of a
  changing string (as-you-type). Returns `{ entities, isDetecting, status, error }`,
  is cancellation-safe (latest text wins), and manages model readiness internally.
- `useDataDetector` hook — tracks model readiness (`status`/`isReady`/`error`),
  exposes `detect`, and auto-downloads the model on Android (opt out with
  `autoPrepare: false`).
- `getModelStatus()` and `isModelReady()` to query whether a language model is
  downloaded. On iOS both always report ready.
- Multi-language support on Android: `detect`, `prepareModel`, `getModelStatus`,
  `isModelReady`, and `useDataDetector` all accept a `language` option (ISO 639-1
  code) selecting one of 15 ML Kit models. Defaults to `'en'`. Ignored on iOS.

### Changed

- Renamed `downloadModel()` to `prepareModel()` — clearer intent and now accepts a
  `{ language }` option. `downloadModel()` remains as a deprecated alias (targets
  the default `'en'` model) and will be removed in a future major version.
- Ship an explicit `files` allowlist in `package.json` and drop the stale
  `.npmignore`; development config (ESLint, Prettier, EditorConfig, CONTRIBUTING)
  is no longer included in the published tarball.
- README hero image now uses an absolute URL so it renders on npmjs.com.

### Fixed

- Corrected the minimum Android SDK to **API 26**. ML Kit Entity Extraction
  (`entity-extraction:16.0.0-beta6`) declares `minSdk 26`, so apps at `minSdk 24`
  failed to build (manifest merge). The library's declared `minSdkVersion` and the
  README requirement are now `26`.
- iOS: return UTF-16 offsets from `NSDataDetector` instead of grapheme-cluster
  distances, so `start`/`end` align with JavaScript string indices and Android's
  ML Kit char offsets. Previously mismatched on text containing emoji, accented,
  or non-BMP characters.
- Android: read the library version from `package.json` instead of a hardcoded
  value, so `build.gradle` can no longer drift from the published version.

## [0.2.0]

- Initial public release: cross-platform text data detection using
  `NSDataDetector` on iOS and ML Kit Entity Extraction on Android.

[Unreleased]: https://github.com/pablogdcr/react-native-data-detector/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/pablogdcr/react-native-data-detector/releases/tag/v0.2.0
