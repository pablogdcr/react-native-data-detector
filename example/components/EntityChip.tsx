import { StyleSheet, Text, View } from 'react-native';
import type { DetectedEntity } from 'react-native-data-detector';

import { TYPE_COLORS, TYPE_LABELS } from '../constants';
import { C } from '../theme';

interface Props {
  entity: DetectedEntity;
}

export function EntityChip({ entity }: Props) {
  const color = TYPE_COLORS[entity.type];

  return (
    <View style={styles.chip}>
      <View style={styles.head}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.type, { color }]}>{TYPE_LABELS[entity.type]}</Text>
      </View>
      <Text style={styles.text} numberOfLines={1}>
        {entity.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  type: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  text: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
