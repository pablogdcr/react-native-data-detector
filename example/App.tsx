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
  detect,
  downloadModel,
  type DetectedEntity,
  type DetectionType,
} from '@themobilefirstcompany/react-native-data-detector';

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

export default function App() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedTypes, setSelectedTypes] = useState<Set<DetectionType>>(new Set(ALL_TYPES));
  const [results, setResults] = useState<DetectedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<string | null>(null);

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

  const handleDownloadModel = async () => {
    setModelStatus('Downloading…');
    try {
      const success = await downloadModel();
      setModelStatus(success ? 'Model ready' : 'No download needed');
    } catch (e: any) {
      setModelStatus(`Error: ${e.message}`);
    }
  };

  const handleDetect = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const types = Array.from(selectedTypes);
      const entities = await detect(text, types.length < ALL_TYPES.length ? { types } : undefined);
      setResults(entities);
    } catch (e: any) {
      setResults([]);
      setModelStatus(`Detection error: ${e.message}`);
    } finally {
      setLoading(false);
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

        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Pressable style={styles.downloadButton} onPress={handleDownloadModel}>
              <Text style={styles.downloadButtonText}>Download Model (Android)</Text>
            </Pressable>
            {modelStatus && <Text style={styles.statusText}>{modelStatus}</Text>}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Input Text</Text>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Enter text to analyze…"
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

        <Pressable
          style={[styles.detectButton, loading && styles.detectButtonDisabled]}
          onPress={handleDetect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.detectButtonText}>Detect Entities</Text>
          )}
        </Pressable>

        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Results ({results.length} {results.length === 1 ? 'entity' : 'entities'})
            </Text>
            {results.map((entity, index) => (
              <View
                key={index}
                style={[styles.card, { borderLeftColor: TYPE_COLORS[entity.type] }]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.badge, { backgroundColor: TYPE_COLORS[entity.type] }]}
                  >
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
            ))}
          </View>
        )}
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
  downloadButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 6,
    textAlign: 'center',
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
