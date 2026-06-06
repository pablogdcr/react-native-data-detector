import { Pressable, StyleSheet, Text } from 'react-native';
import type { ModelLanguage } from 'react-native-data-detector';

import { LANGUAGES } from '../constants';
import { C } from '../theme';

interface Props {
  language: ModelLanguage;
  onPress: () => void;
}

export function LanguageButton({ language, onPress }: Props) {
  const name = LANGUAGES.find((l) => l.code === language)?.name ?? language;

  return (
    <Pressable style={styles.dropdown} onPress={onPress}>
      <Text style={styles.text}>{name}</Text>
      <Text style={styles.caret}>▾</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  text: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },
  caret: {
    color: C.muted,
    fontSize: 11,
    marginTop: 1,
  },
});
