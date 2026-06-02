# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- iOS: return UTF-16 offsets from `NSDataDetector` instead of grapheme-cluster
  distances, so `start`/`end` align with JavaScript string indices and Android's
  ML Kit char offsets. Previously mismatched on text containing emoji, accented,
  or non-BMP characters.
- Android: read the library version from `package.json` instead of a hardcoded
  value, so `build.gradle` can no longer drift from the published version.

### Changed

- Ship an explicit `files` allowlist in `package.json` and drop the stale
  `.npmignore`; development config (ESLint, Prettier, EditorConfig, CONTRIBUTING)
  is no longer included in the published tarball.
- README hero image now uses an absolute URL so it renders on npmjs.com.

## [0.2.0]

- Initial public release: cross-platform text data detection using
  `NSDataDetector` on iOS and ML Kit Entity Extraction on Android.

[Unreleased]: https://github.com/pablogdcr/react-native-data-detector/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/pablogdcr/react-native-data-detector/releases/tag/v0.2.0
