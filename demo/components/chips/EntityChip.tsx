import * as Haptics from 'expo-haptics';
import { memo, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { DetectedEntity } from 'react-native-data-detector';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TYPE_COLORS, TYPE_GLYPHS } from '../../constants';
import { C, TYPO } from '../../theme';
import { ChipGlow } from './ChipGlow';

interface Props {
  entity: DetectedEntity;
  settled: boolean;
  /** character offsets in the raw text, for caret placement */
  start: number;
  end: number;
  onCaretMove: (index: number) => void;
}

const ICON_SLOT = 20;
const ICON_GAP = 6;
const PILL_PAD = 8;
// layout box is a full text line tall; the visible pill is inset to chipHeight
const CHIP_INSET = (TYPO.lineHeight - TYPO.chipHeight) / 2;
// extra width gained on settle, so the icon opens beside the text instead of squeezing it
const GROW = ICON_SLOT + ICON_GAP;

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function actionUrl(entity: DetectedEntity): string | null {
  const { type, text, data } = entity;
  switch (type) {
    case 'phoneNumber':
      return `tel:${(data?.phoneNumber ?? text).replace(/[^\d+]/g, '')}`;
    case 'email':
      return `mailto:${data?.email ?? text}`;
    case 'link': {
      const url = data?.url ?? text;
      return /^[a-z]+:\/\//i.test(url) ? url : `https://${url}`;
    }
    case 'address':
      return `http://maps.apple.com/?q=${encodeURIComponent(data?.address ?? text)}`;
    default:
      return null; // dates have no safe public deep link
  }
}

function calendarParts(entity: DetectedEntity): { day: string; month: string } | null {
  const iso = entity.data?.date;
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: String(d.getDate()),
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// One pill for both phases. Mounts as the grey settling highlight and morphs in
// place into the colored chip when `settled` flips — same node throughout, so
// nothing remounts mid-transition.
function EntityChipBase({ entity, settled, start, end, onCaretMove }: Props) {
  const color = TYPE_COLORS[entity.type];
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [textWidth, setTextWidth] = useState(0);

  const appear = useSharedValue(0);
  const progress = useSharedValue(0); // grey -> chip
  const pop = useSharedValue(1);

  useEffect(() => {
    appear.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) });
  }, [appear]);

  useEffect(() => {
    if (!settled) return;
    progress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    pop.value = withSequence(
      withTiming(1.03, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 18, stiffness: 200 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [settled, progress, pop]);

  // withAlpha can't run inside a worklet, precompute on the JS side
  const tintBg = withAlpha(color, 0.16);
  const tintBorder = withAlpha(color, 0.55);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
    // pinned to the measured text width while settling, grows by GROW as it ripens
    width: textWidth > 0 ? textWidth + GROW * progress.value : undefined,
    paddingHorizontal: PILL_PAD * progress.value,
  }));
  const bgStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    backgroundColor: interpolateColor(progress.value, [0, 1], [C.settling, tintBg]),
    // border fades in with the chip; width stays 1 so height never shifts
    borderColor: interpolateColor(progress.value, [0, 1], [C.bg, tintBorder]),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    width: progress.value * ICON_SLOT,
    marginRight: progress.value * ICON_GAP,
    opacity: progress.value,
    transform: [{ scale: 0.5 + progress.value * 0.5 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  // tap places the caret at whichever edge is nearer; the action lives on long-press
  const onPressChip = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    onCaretMove(size.width > 0 && x > size.width / 2 ? end : start);
  };

  const onAction = () => {
    const url = actionUrl(entity);
    if (url) {
      Haptics.selectionAsync().catch(() => {});
      Linking.openURL(url).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  };

  const cal = entity.type === 'date' ? calendarParts(entity) : null;

  return (
    <AnimatedPressable
      // minWidth floor: the animated width can lag a frame on mount, and a flex:1
      // value in a zero-width pill would collapse for that frame
      style={[styles.chip, containerStyle, textWidth > 0 ? { minWidth: textWidth } : null]}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      onPress={onPressChip}
      onLongPress={onAction}
      hitSlop={8}
    >
      {() => (
        <>
          <Animated.View style={[styles.bg, bgStyle]} pointerEvents="none" />
          <Animated.View style={[styles.fill, glowStyle]} pointerEvents="none">
            <ChipGlow
              width={size.width}
              height={TYPO.chipHeight}
              radius={styles.chip.borderRadius}
              color={color}
            />
          </Animated.View>

          {/* invisible ruler: measures the entity text at the page font */}
          <Text
            style={styles.measure}
            numberOfLines={1}
            allowFontScaling={false}
            onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
          >
            {entity.text}
          </Text>

          {textWidth > 0 ? (
            <>
              <Animated.View style={[styles.iconSlot, iconStyle]}>
                {cal ? (
                  <View style={[styles.cal, { borderColor: withAlpha(color, 0.5) }]}>
                    <Text style={[styles.calMonth, { backgroundColor: color }]}>{cal.month}</Text>
                    <Text style={styles.calDay}>{cal.day}</Text>
                  </View>
                ) : (
                  <Text style={[styles.glyph, { color }]}>{TYPE_GLYPHS[entity.type]}</Text>
                )}
              </Animated.View>

              <Text
                style={styles.value}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.3}
              >
                {entity.text}
              </Text>
            </>
          ) : (
            // ruler hasn't reported yet: show the content-sized text so the pill
            // is never blank on its first frame
            <Text style={styles.valuePlain} numberOfLines={1} allowFontScaling={false}>
              {entity.text}
            </Text>
          )}
        </>
      )}
    </AnimatedPressable>
  );
}

export const EntityChip = memo(
  EntityChipBase,
  (prev, next) =>
    prev.settled === next.settled &&
    prev.start === next.start &&
    prev.end === next.end &&
    prev.onCaretMove === next.onCaretMove &&
    prev.entity.text === next.entity.text &&
    prev.entity.type === next.entity.type,
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TYPO.lineHeight,
    borderRadius: 11,
  },
  bg: {
    position: 'absolute',
    top: CHIP_INSET,
    bottom: CHIP_INSET,
    left: 0,
    right: 0,
    borderRadius: 11,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  fill: {
    position: 'absolute',
    top: CHIP_INSET,
    bottom: CHIP_INSET,
    left: 0,
    right: 0,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    fontSize: TYPO.fontSize,
    lineHeight: TYPO.lineHeight,
    fontWeight: TYPO.fontWeight,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: {
    fontSize: 13.5,
  },
  value: {
    color: C.text,
    fontSize: TYPO.fontSize,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  valuePlain: {
    color: C.text,
    fontSize: TYPO.fontSize,
    fontWeight: '600',
  },
  cal: {
    width: 19,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: C.surfaceHi,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  calMonth: {
    color: '#0B0C10',
    fontSize: 6.5,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  calDay: {
    color: C.text,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
