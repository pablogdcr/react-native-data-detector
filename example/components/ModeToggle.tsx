import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C } from '../theme';

export type Mode = 'reactive' | 'imperative';

const OPTIONS: [Mode, string][] = [
  ['reactive', 'Live'],
  ['imperative', 'On tap'],
];

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <View style={styles.toggle}>
      {OPTIONS.map(([value, label]) => {
        const active = mode === value;

        return (
          <Pressable
            key={value}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onChange(value)}
          >
            <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    padding: 3,
  },
  item: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  itemActive: {
    backgroundColor: C.accent,
  },
  text: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  textActive: {
    color: '#fff',
  },
});
