import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ModelStatus as Status } from 'react-native-data-detector';

import { C } from '../theme';

const LABELS: Record<string, string> = {
  downloading: 'Downloading model…',
  error: 'Model error',
  notDownloaded: 'Model not downloaded',
};

/** Renders a subtle status line — nothing when the model is ready. */
export function ModelStatus({ status }: { status: Status }) {
  if (status === 'ready') return null;
  return (
    <View style={styles.row}>
      {status === 'downloading' && <ActivityIndicator size="small" color={C.muted} />}
      <Text style={styles.text}>{LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  text: { color: C.muted, fontSize: 13 },
});
