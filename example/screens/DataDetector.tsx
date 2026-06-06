import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  useDataDetector,
  useDetectedEntities,
  type DetectedEntity,
  type ModelLanguage,
} from 'react-native-data-detector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetectButton } from '../components/DetectButton';
import { DetectInput } from '../components/DetectInput';
import { DetectedList } from '../components/DetectedList';
import { Header } from '../components/Header';
import { LanguageButton } from '../components/LanguageButton';
import { LanguageSheet } from '../components/LanguageSheet';
import { ModeToggle, type Mode } from '../components/ModeToggle';
import { ModelStatus } from '../components/ModelStatus';
import { SAMPLE_TEXT } from '../constants';
import { C, SCREEN_PADDING } from '../theme';

export default function DataDetector() {
  const insets = useSafeAreaInsets();

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
  const isAndroid = Platform.OS === 'android';

  const handleDetect = async () => {
    setDetecting(true);
    detect(text)
      .then(setTappedEntities)
      .catch(() => setTappedEntities([]))
      .finally(() => setDetecting(false));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View
          style={[styles.body, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}
        >
          <Header />

          <View style={styles.controls}>
            {isAndroid ? (
              <LanguageButton language={language} onPress={() => setLangOpen(true)} />
            ) : (
              <View />
            )}
            <ModeToggle mode={mode} onChange={setMode} />
          </View>

          {isAndroid && <ModelStatus status={status} />}

          <View style={styles.spacer} />

          <DetectedList entities={entities} busy={busy} status={status} mode={mode} />
          <DetectInput
            value={text}
            onChangeText={setText}
            placeholder="Type something with a phone, email, link, address or date…"
          />
          {mode === 'imperative' && (
            <DetectButton detecting={detecting} isReady={isReady} onPress={handleDetect} />
          )}
        </View>
      </KeyboardAvoidingView>

      <LanguageSheet
        visible={langOpen}
        selected={language}
        onSelect={(code) => {
          setLanguage(code);
          setLangOpen(false);
        }}
        onClose={() => setLangOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
});
