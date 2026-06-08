import { Blur, Canvas, Group, RoundedRect } from '@shopify/react-native-skia';
import { View } from 'react-native';

interface Props {
  width: number;
  height: number;
  radius: number;
  color: string;
}

// Soft colored halo behind a chip, drawn with Skia. Purely decorative.
export function ChipGlow({ width, height, radius, color }: Props) {
  const blur = 12;
  // keep the canvas ~3*blur larger than the rect or the gaussian tail gets
  // clipped flat at the bounds (most visible on the top/bottom edges)
  const spread = blur * 3;
  if (width <= 0 || height <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -spread,
        top: -spread,
        width: width + spread * 2,
        height: height + spread * 2,
      }}
    >
      <Canvas style={{ flex: 1 }}>
        <Group opacity={0.55}>
          <RoundedRect
            x={spread}
            y={spread}
            width={width}
            height={height}
            r={radius}
            color={color}
          >
            <Blur blur={blur} />
          </RoundedRect>
        </Group>
      </Canvas>
    </View>
  );
}
