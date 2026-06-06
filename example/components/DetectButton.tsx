import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { C } from '../theme';

interface Props {
  detecting: boolean;
  isReady: boolean;
  onPress: () => void;
}

export function DetectButton({ detecting, isReady, onPress }: Props) {
  const disabled = detecting || !isReady;

  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {detecting ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{isReady ? 'Detect' : 'Preparing model…'}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
