import { Platform, StyleSheet, Text, View } from 'react-native';

import { C } from '../theme';

export function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Data Detector</Text>
      <Text style={styles.subtitle}>
        {Platform.OS === 'ios' ? 'NSDataDetector' : 'ML Kit Entity Extraction'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
