import { StyleSheet, TextInput, View } from 'react-native';

import { C } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function DetectInput({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        multiline
        placeholder={placeholder}
        placeholderTextColor={C.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
});
