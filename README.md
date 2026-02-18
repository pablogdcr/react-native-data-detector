# react-native-data-detector

Cross-platform text data detection for React Native. Uses **NSDataDetector** on iOS and **ML Kit Entity Extraction** on Android to detect phone numbers, URLs, emails, dates, and addresses — returning structured results to JavaScript.

<p align="center">
  <img src="data-collector.png" alt="Data Detector Example" width="300" />
</p>

## Features

- **Phone numbers** — Detect and extract phone numbers
- **URLs** — Detect web links
- **Emails** — Detect email addresses
- **Addresses** — Detect street addresses with parsed components (iOS)
- **Dates** — Detect dates and times with ISO 8601 output
- **Native accuracy** — Uses battle-tested platform APIs instead of regex
- **Expo Modules API** — Built with the modern Expo native module system

## Installation

```bash
npm install react-native-data-detector
```

### iOS

```bash
npx pod-install
```

### Android

The ML Kit entity extraction model (~5.6MB) is downloaded on the user's device at runtime. You can control when this happens using [`downloadModel()`](#downloadmodel) — for example, calling it at app startup to ensure `detect()` works offline later. If you don't call it explicitly, the model will be downloaded automatically on the first `detect()` call.

## Usage

```typescript
import { detect, downloadModel } from 'react-native-data-detector';

// Pre-download the ML Kit model at app startup (Android only, no-op on iOS)
await downloadModel();

// Detect all entity types
const entities = await detect('Call me at 555-1234 or email john@example.com');
// [
//   { type: 'phoneNumber', text: '555-1234', start: 14, end: 22, data: { phoneNumber: '555-1234' } },
//   { type: 'email', text: 'john@example.com', start: 32, end: 48, data: { email: 'john@example.com' } }
// ]

// Detect only specific types
const phones = await detect('Call 555-1234 or visit https://example.com', {
  types: ['phoneNumber'],
});
// [
//   { type: 'phoneNumber', text: '555-1234', start: 5, end: 13, data: { phoneNumber: '555-1234' } }
// ]
```

## API

### `downloadModel()`

Pre-downloads the ML Kit entity extraction model on Android. On iOS, this is a no-op that resolves immediately — `NSDataDetector` is built into the OS and requires no model download.

Call this at app startup or before the first `detect()` call to ensure the model is available offline.

**Returns:** `Promise<boolean>` — `true` when the model is ready.

| Platform | Behavior |
|----------|----------|
| **iOS** | No-op, resolves `true` immediately |
| **Android** | Downloads the ML Kit model (~5.6MB) if not already cached. Requires internet on first call. |

### `detect(text, options?)`

Detects entities in the given text using native platform APIs.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | The text to analyze |
| `options` | `DetectOptions` | Optional configuration |

**DetectOptions:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `types` | `DetectionType[]` | All types | Which entity types to detect |

**DetectionType:** `'phoneNumber' | 'link' | 'email' | 'address' | 'date'`

**Returns:** `Promise<DetectedEntity[]>`

### `DetectedEntity`

| Property | Type | Description |
|----------|------|-------------|
| `type` | `DetectionType` | The type of detected entity |
| `text` | `string` | The matched text substring |
| `start` | `number` | Start index in the original string |
| `end` | `number` | End index (exclusive) in the original string |
| `data` | `Record<string, string>` | Additional structured data (see below) |

### Entity Data by Type

| Type | Data fields |
|------|-------------|
| `phoneNumber` | `{ phoneNumber }` |
| `link` | `{ url }` |
| `email` | `{ email }` |
| `address` | `{ street, city, state, zip, country }` (iOS) / `{ address }` (Android) |
| `date` | `{ date }` ISO 8601 string |

## Platform Differences

| Feature | iOS | Android |
|---------|-----|---------|
| Engine | NSDataDetector | ML Kit Entity Extraction |
| Offline | Always | After `downloadModel()` or first `detect()` call |
| Model download | Not needed | ~5.6MB, on-device at runtime |
| Address parsing | Structured components | Raw string |
| Date output | ISO 8601 | ISO 8601 |

## Requirements

- iOS 15.1+
- Android API 24+ (minSdk)
- Expo SDK 50+ or bare React Native with `expo-modules-core`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
