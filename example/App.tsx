import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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

const SAMPLE_TEXT = 'Call me at (555) 123-4567 or email john@example.com tomorrow at 9:30pm.';

// — Theme —————————————————————————————————————————————————————————————
const C = {
  bg: '#0B0C10',
  surface: '#16181D',
  surfaceHi: '#1E2128',
  border: 'rgba(255,255,255,0.08)',
  text: '#F4F4F6',
  muted: '#8B8D98',
  accent: '#6366F1',
};

const TYPE_COLORS: Record<DetectionType, string> = {
  phoneNumber: '#A78BFA',
  link: '#60A5FA',
  email: '#34D399',
  address: '#FBBF24',
  date: '#F472B6',
};

const TYPE_LABELS: Record<DetectionType, string> = {
  phoneNumber: 'Phone',
  link: 'Link',
  email: 'Email',
  address: 'Address',
  date: 'Date',
};

const LANGUAGES: { code: ModelLanguage; name: string }[] = [
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

type Mode = 'reactive' | 'imperative';

export default function App() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [language, setLanguage] = useState<ModelLanguage>('en');
  const [mode, setMode] = useState<Mode>('reactive');
  const [langOpen, setLangOpen] = useState(false);

  // Imperative hook: model lifecycle + a detect() you call yourself.
  const { detect, status, isReady } = useDataDetector({ language });

  // Reactive hook: debounced detection as `text` changes (paused in "On tap" mode).
  const { entities: liveEntities, isDetecting } = useDetectedEntities(text, {
    language,
    debounceMs: 200,
    enabled: mode === 'reactive',
  });

  const [tappedEntities, setTappedEntities] = useState<DetectedEntity[]>([]);
  const [detecting, setDetecting] = useState(false);

  const entities = mode === 'reactive' ? liveEntities : tappedEntities;
  const busy = mode === 'reactive' ? isDetecting : detecting;

  const handleDetect = async () => {
    setDetecting(true);
    try {
      setTappedEntities(await detect(text));
    } catch {
      setTappedEntities([]);
    } finally {
      setDetecting(false);
    }
  };

  const languageName = LANGUAGES.find((l) => l.code === language)?.name ?? language;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.title}>Data Detector</Text>
            <Text style={styles.subtitle}>
              {Platform.OS === 'ios' ? 'NSDataDetector' : 'ML Kit Entity Extraction'}
            </Text>
          </View>

          {/* Compact controls: language dropdown + mode toggle */}
          <View style={styles.controls}>
            {Platform.OS === 'android' ? (
              <Pressable style={styles.dropdown} onPress={() => setLangOpen(true)}>
                <Text style={styles.dropdownText}>{languageName}</Text>
                <Text style={styles.caret}>▾</Text>
              </Pressable>
            ) : (
              <View />
            )}

            <View style={styles.toggle}>
              {(
                [
                  ['reactive', 'Live'],
                  ['imperative', 'On tap'],
                ] as const
              ).map(([value, label]) => {
                const active = mode === value;
                return (
                  <Pressable
                    key={value}
                    style={[styles.toggleItem, active && styles.toggleItemActive]}
                    onPress={() => setMode(value)}
                  >
                    <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Subtle model status — only when not ready */}
          {Platform.OS === 'android' && status !== 'ready' && (
            <View style={styles.statusRow}>
              {status === 'downloading' && <ActivityIndicator size="small" color={C.muted} />}
              <Text style={styles.statusText}>
                {status === 'downloading'
                  ? 'Downloading model…'
                  : status === 'error'
                    ? 'Model error'
                    : 'Model not downloaded'}
              </Text>
            </View>
          )}

          <View style={styles.spacer} />

          {/* Detected — horizontal, above the input so it stays clear of the keyboard */}
          <View style={styles.detectedHeader}>
            <Text style={styles.label}>Detected · {entities.length}</Text>
            {busy && <ActivityIndicator size="small" color={C.muted} />}
          </View>

          {entities.length === 0 ? (
            <View style={styles.emptyStrip}>
              <Text style={styles.emptyText}>
                {status !== 'ready' && Platform.OS === 'android'
                  ? 'Preparing model…'
                  : mode === 'reactive'
                    ? 'Start typing to detect…'
                    : 'Tap Detect to analyze.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
              keyboardShouldPersistTaps="handled"
            >
              {entities.map((entity, index) => {
                const color = TYPE_COLORS[entity.type];
                return (
                  <View key={index} style={styles.entityChip}>
                    <View style={styles.entityChipHead}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <Text style={[styles.entityType, { color }]}>{TYPE_LABELS[entity.type]}</Text>
                    </View>
                    <Text style={styles.entityText} numberOfLines={1}>
                      {entity.text}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              multiline
              placeholder="Type something with a phone, email, link, address or date…"
              placeholderTextColor={C.muted}
            />
          </View>

          {mode === 'imperative' && (
            <Pressable
              style={[styles.detectBtn, (detecting || !isReady) && styles.detectBtnDisabled]}
              onPress={handleDetect}
              disabled={detecting || !isReady}
            >
              {detecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.detectBtnText}>{isReady ? 'Detect' : 'Preparing model…'}</Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Language picker sheet */}
      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setLangOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Language model</Text>
            <ScrollView style={styles.sheetList}>
              {LANGUAGES.map((l) => {
                const active = l.code === language;
                return (
                  <Pressable
                    key={l.code}
                    style={styles.langRow}
                    onPress={() => {
                      setLanguage(l.code);
                      setLangOpen(false);
                    }}
                  >
                    <Text style={[styles.langRowText, active && styles.langRowActive]}>
                      {l.name}
                    </Text>
                    {active && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 12,
    paddingBottom: 16,
  },
  header: { marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dropdownText: { color: C.text, fontSize: 14, fontWeight: '600' },
  caret: { color: C.muted, fontSize: 11, marginTop: 1 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    padding: 3,
  },
  toggleItem: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999 },
  toggleItemActive: { backgroundColor: C.accent },
  toggleText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  statusText: { color: C.muted, fontSize: 13 },

  spacer: { flex: 1, minHeight: 16 },

  detectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyStrip: {
    height: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: C.muted, fontSize: 13 },

  strip: { gap: 10, paddingRight: 4 },
  entityChip: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    minWidth: 124,
    maxWidth: 220,
    height: 76,
    justifyContent: 'center',
    gap: 7,
  },
  entityChipHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  entityType: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  entityText: { color: C.text, fontSize: 15, fontWeight: '600' },

  inputWrap: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 16,
  },
  input: {
    color: C.text,
    fontSize: 16,
    lineHeight: 22,
    padding: 16,
    minHeight: 56,
    maxHeight: 130,
    textAlignVertical: 'top',
  },

  detectBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  detectBtnDisabled: { opacity: 0.5 },
  detectBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surfaceHi,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  sheetTitle: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  sheetList: { maxHeight: 360 },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  langRowText: { color: C.text, fontSize: 16 },
  langRowActive: { color: C.accent, fontWeight: '700' },
  check: { color: C.accent, fontSize: 16, fontWeight: '700' },
});
