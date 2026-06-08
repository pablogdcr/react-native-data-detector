import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';

import { SCREEN_PADDING, TYPO } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  selection?: { start: number; end: number };
  onSelectionChange?: (selection: { start: number; end: number }) => void;
}

// Full-bleed invisible TextInput that just captures keystrokes and holds the raw
// string — the visible writing is drawn by the overlay on top.
export const HiddenInputSink = forwardRef<TextInput, Props>(function HiddenInputSink(
  { value, onChangeText, selection, onSelectionChange },
  ref,
) {
  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    onSelectionChange?.(e.nativeEvent.selection);
  };

  return (
    <TextInput
      ref={ref}
      value={value}
      onChangeText={onChangeText}
      selection={selection}
      onSelectionChange={handleSelectionChange}
      multiline
      autoFocus
      caretHidden
      // no soft keyboard: type via Simulator → I/O → Keyboard → Connect Hardware
      // Keyboard so the page stays full-screen for recording
      showSoftInputOnFocus={false}
      scrollEnabled={false}
      contextMenuHidden
      selectTextOnFocus={false}
      autoCorrect={false}
      autoCapitalize="none"
      spellCheck={false}
      keyboardAppearance="dark"
      style={styles.input}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SCREEN_PADDING,
    fontSize: TYPO.fontSize,
    lineHeight: TYPO.lineHeight,
    color: 'transparent',
  },
});
