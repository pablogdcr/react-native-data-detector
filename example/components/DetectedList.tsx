import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DetectedEntity, ModelStatus } from 'react-native-data-detector';

import { C, SCREEN_PADDING } from '../theme';
import { EntityChip } from './EntityChip';
import type { Mode } from './ModeToggle';

interface Props {
  entities: DetectedEntity[];
  busy: boolean;
  status: ModelStatus;
  mode: Mode;
}

export function DetectedList({ entities, busy, status, mode }: Props) {
  const preparing = Platform.OS === 'android' && status !== 'ready';

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.label}>Detected · {entities.length}</Text>
        {busy && <ActivityIndicator size="small" color={C.muted} />}
      </View>

      {entities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {preparing
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
          style={styles.scroll}
          contentContainerStyle={styles.strip}
          keyboardShouldPersistTaps="handled"
        >
          {entities.map((entity, index) => (
            <EntityChip key={index} entity={entity} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  empty: {
    height: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: C.muted, fontSize: 13 },
  scroll: {
    marginHorizontal: -SCREEN_PADDING,
  },
  strip: {
    gap: 10,
    paddingHorizontal: SCREEN_PADDING,
  },
});
