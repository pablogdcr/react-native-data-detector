import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useDataDetector,
  useDetectedEntities,
  type DetectedEntity,
  type DetectionType,
  type ModelLanguage,
} from 'react-native-data-detector';

const SAMPLE_TEXT =
  'Call me at (555) 123-4567 or email john@example.com.\n' +
  'Visit https://reactnative.dev for docs.\n' +
  'Meet me at 1 Infinite Loop, Cupertino, CA 95014 on March 15, 2025.';

const ALL_TYPES: DetectionType[] = ['phoneNumber', 'link', 'email', 'address', 'date'];

const TYPE_COLORS: Record<DetectionType, string> = {
  phoneNumber: '#5856D6',
  link: '#007AFF',
  email: '#34C759',
  address: '#FF9500',
  date: '#FF2D55',
};

const TYPE_LABELS: Record<DetectionType, string> = {
  phoneNumber: 'Phone',
  link: 'Link',
  email: 'Email',
  address: 'Address',
  date: 'Date',
};

const LANGUAGES: ModelLanguage[] = ['en', 'fr', 'es', 'de', 'ja', 'zh'];

const STATUS_LABELS: Record<string, string> = {
  notDownloaded: 'Model not downloaded',
  downloading: 'Downloading model…',
  ready: 'Model ready',
  error: 'Model error',
};

type Mode = 'reactive' | 'imperative';

export default function App() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedTypes, setSelectedTypes] = useState<Set<DetectionType>>(new Set(ALL_TYPES));
  const [language, setLanguage] = useState<ModelLanguage>('en');
  const [mode, setMode] = useState<Mode>('reactive');

  const types = Array.from(selectedTypes);

  // Imperative hook: model lifecycle (status/prepare) + a detect() you call yourself.
  const { detect, status, isReady, prepare, error: modelError } = useDataDetector({ language });

  // Reactive hook: debounced detection as `text` changes. Paused in imperative mode.
  const {
    entities: liveEntities,
    isDetecting,
    error: liveError,
  } = useDetectedEntities(text, {
    types,
    language,
    debounceMs: 250,
    enabled: mode === 'reactive',
  });

  // Imperative-mode result state, populated by the Detect button.
  const [tappedEntities, setTappedEntities] = useState<DetectedEntity[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [tapError, setTapError] = useState<Error | null>(null);

  const entities = mode === 'reactive' ? liveEntities : tappedEntities;
  const busy = mode === 'reactive' ? isDetecting : detecting;
  const detectionError = mode === 'reactive' ? liveError : tapError;

  const toggleType = (type: DetectionType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleDetect = async () => {
    setDetecting(true);
    setTapError(null);
    try {
      const res = await detect(text, { types });
      setTappedEntities(res);
    } catch (e: any) {
      setTappedEntities([]);
      setTapError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setDetecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Data Detector</Text>
        <Text style={styles.subtitle}>
          {Platform.OS === 'ios' ? 'NSDataDetector' : 'ML Kit Entity Extraction'}
        </Text>

        {/* Model lifecycle: getModelStatus / isModelReady / prepareModel (Android). */}
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={styles.label}>Language Model</Text>
            <View style={styles.chips}>
              {LANGUAGES.map((lang) => {
                const active = language === lang;
                return (
                  <Pressable
                    key={lang}
                    style={[styles.chip, styles.langChip, active && styles.langChipActive]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {lang.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.statusRow}>
              {status === 'downloading' && <ActivityIndicator size="small" color="#8E8E93" />}
              <Text style={styles.statusText}>
                {modelError ? `Error: ${modelError.message}` : (STATUS_LABELS[status] ?? status)}
              </Text>
            </View>
            {status === 'error' && (
              <Pressable style={styles.retryButton} onPress={() => prepare().catch(() => {})}>
                <Text style={styles.retryButtonText}>Retry Download</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Two hooks, two modes. */}
        <View style={styles.section}>
          <Text style={styles.label}>Detection Mode</Text>
          <View style={styles.segment}>
            {(
              [
                ['reactive', 'As you type', 'useDetectedEntities'],
                ['imperative', 'On tap', 'useDataDetector'],
              ] as const
            ).map(([value, title, sub]) => {
              const active = mode === value;
              return (
                <Pressable
                  key={value}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  onPress={() => setMode(value)}
                >
                  <Text style={[styles.segmentTitle, active && styles.segmentTitleActive]}>
                    {title}
                  </Text>
                  <Text style={[styles.segmentSub, active && styles.segmentSubActive]}>{sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Input Text</Text>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            multiline
            placeholder={mode === 'reactive' ? 'Start typing to detect…' : 'Enter text to analyze…'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Entity Types</Text>
          <View style={styles.chips}>
            {ALL_TYPES.map((type) => {
              const active = selectedTypes.has(type);
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.chip,
                    { borderColor: TYPE_COLORS[type] },
                    active && { backgroundColor: TYPE_COLORS[type] },
                  ]}
                  onPress={() => toggleType(type)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {mode === 'imperative' && (
          <Pressable
            style={[styles.detectButton, (detecting || !isReady) && styles.detectButtonDisabled]}
            onPress={handleDetect}
            disabled={detecting || !isReady}
          >
            {detecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.detectButtonText}>
                {isReady ? 'Detect Entities' : 'Preparing model…'}
              </Text>
            )}
          </Pressable>
        )}

        {detectionError && (
          <Text style={styles.errorText}>Error: {detectionError.message}</Text>
        )}

        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={styles.label}>
              Results ({entities.length} {entities.length === 1 ? 'entity' : 'entities'})
            </Text>
            {busy && <ActivityIndicator size="small" color="#8E8E93" />}
          </View>

          {entities.length === 0 ? (
            <Text style={styles.statusText}>
              {status !== 'ready'
                ? 'Preparing model…'
                : mode === 'reactive'
                  ? 'No entities — keep typing…'
                  : 'Tap “Detect Entities” to analyze.'}
            </Text>
          ) : (
            entities.map((entity, index) => (
              <View key={index} style={[styles.card, { borderLeftColor: TYPE_COLORS[entity.type] }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: TYPE_COLORS[entity.type] }]}>
                    <Text style={styles.badgeText}>{TYPE_LABELS[entity.type]}</Text>
                  </View>
                  <Text style={styles.range}>
                    [{entity.start}–{entity.end}]
                  </Text>
                </View>
                <Text style={styles.matchedText}>"{entity.text}"</Text>
                {entity.data && Object.keys(entity.data).length > 0 && (
                  <View style={styles.dataContainer}>
                    {Object.entries(entity.data).map(([key, value]) => (
                      <Text key={key} style={styles.dataText}>
                        {key}: {value}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#000',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentItemActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  segmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  segmentTitleActive: {
    color: '#fff',
  },
  segmentSub: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  segmentSubActive: {
    color: '#D6E6FF',
  },
  detectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  detectButtonDisabled: {
    opacity: 0.6,
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  statusText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  langChip: {
    borderColor: '#C7C7CC',
  },
  langChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  range: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  matchedText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  dataContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  dataText: {
    fontSize: 13,
    color: '#636366',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
