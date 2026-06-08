import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowingText } from '../components/FlowingText';
import { HiddenInputSink } from '../components/HiddenInputSink';
import { DEMO_SCRIPT } from '../constants';
import { useAutoType } from '../hooks/useAutoType';
import { useLiveEntities } from '../hooks/useLiveEntities';
import { C, SCREEN_PADDING, TYPO } from '../theme';

export default function WritingScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const { segments } = useLiveEntities(text);
  const { isRunning, start, stop } = useAutoType(setText, DEMO_SCRIPT);

  // during the auto-typed demo the input is blurred, so pin the caret to the end
  const caretIndex = isRunning ? text.length : Math.min(selection.end, text.length);
  const controlledSelection = isRunning
    ? { start: text.length, end: text.length }
    : selection;

  // settled chips are atomic: the caret can sit before or after one, never inside
  const chipRanges = useMemo(() => {
    const ranges: [number, number][] = [];
    let off = 0;
    for (const seg of segments) {
      const len = seg.kind === 'plain' ? seg.text.length : seg.entity.end - seg.entity.start;
      if (seg.kind === 'entity' && seg.phase === 'settled') ranges.push([off, off + len]);
      off += len;
    }
    return ranges;
  }, [segments]);

  const prevCaret = useRef(0);
  const textRef = useRef(text);
  textRef.current = text;

  // keep the controlled selection in step with the text, otherwise the caret
  // lags a render behind and jumps
  const handleChangeText = (next: string) => {
    const at = Math.max(0, Math.min(selection.end + (next.length - text.length), next.length));
    prevCaret.current = at;
    setText(next);
    setSelection({ start: at, end: at });
  };

  // stable identity: memoised word tokens and chips receive this
  const moveCaret = useCallback((index: number) => {
    const at = Math.max(0, Math.min(index, textRef.current.length));
    prevCaret.current = at;
    inputRef.current?.focus();
    setSelection({ start: at, end: at });
  }, []);

  // if the caret lands inside a chip, snap it to whichever edge it was heading toward
  const handleSelectionChange = (sel: { start: number; end: number }) => {
    if (sel.start !== sel.end) {
      prevCaret.current = sel.end;
      setSelection(sel);
      return;
    }
    let i = sel.end;
    const movingLeft = i < prevCaret.current;
    for (const [s, e] of chipRanges) {
      if (i > s && i < e) {
        i = movingLeft ? s : e;
        break;
      }
    }
    prevCaret.current = i;
    const next = i;
    setSelection((prev) => (prev.start === next && prev.end === next ? prev : { start: next, end: next }));
  };

  // on the demo→idle transition the controlled selection hasn't been tracking the
  // programmatic text — drop the caret at the end
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !isRunning) {
      prevCaret.current = text.length;
      setSelection({ start: text.length, end: text.length });
    }
    wasRunning.current = isRunning;
  }, [isRunning, text.length]);

  const startDemo = () => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    start();
  };

  const isEmpty = text.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.fill}>
        <HiddenInputSink
          ref={inputRef}
          value={text}
          onChangeText={handleChangeText}
          selection={controlledSelection}
          onSelectionChange={handleSelectionChange}
        />

        <View
          pointerEvents="box-none"
          style={[styles.overlay, { paddingTop: insets.top + 128 }]}
        >
          {isEmpty ? (
            <Text style={styles.placeholder} />
          ) : (
            <FlowingText segments={segments} caretIndex={caretIndex} onCaretMove={moveCaret} />
          )}
        </View>
      </View>

      <Text style={[styles.brand, { top: insets.top + 16 }]} pointerEvents="none">
        react-native-data-detector 0.3.0
      </Text>

      <Pressable
        onPress={isRunning ? stop : startDemo}
        hitSlop={10}
        style={[styles.demo, { bottom: insets.top + 12, opacity: 0.1 }]}
      >
        <Text style={styles.demoLabel}>{isRunning ? '■ Stop' : '▶ Demo'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  fill: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SCREEN_PADDING,
  },
  placeholder: {
    color: C.muted,
    fontSize: TYPO.fontSize,
    lineHeight: TYPO.lineHeight,
    fontWeight: '500',
  },
  brand: {
    marginHorizontal: 16,
    position: 'absolute',
    color: C.muted,
    opacity: 0.4,
    fontSize: 25,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Georgia-Italic',
      android: 'serif',
    }),
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  demo: {
    position: 'absolute',
    right: SCREEN_PADDING,
    backgroundColor: C.surfaceHi,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  demoLabel: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
