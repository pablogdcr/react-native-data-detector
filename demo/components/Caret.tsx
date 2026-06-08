import { memo, useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { C, TYPO } from '../theme';

export const Caret = memo(function Caret() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0, { duration: 530, easing: Easing.linear }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          height: TYPO.fontSize,
          borderRadius: 1.5,
          backgroundColor: C.accent,
          marginLeft: 1,
        },
        style,
      ]}
    />
  );
});
