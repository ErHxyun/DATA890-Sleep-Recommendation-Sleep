import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

export type Ring = {
  key: string;
  color: string;
  /** Fraction of the ring to fill, 0–1. */
  value: number;
};

type RingChartProps = {
  rings: Ring[];
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
};

/** Concentric progress rings, outermost first. `children` renders in the center. */
export function RingChart({ rings, size = 220, strokeWidth = 18, children }: RingChartProps) {
  const theme = useTheme();
  const gap = strokeWidth * 0.45;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {rings.map((ring, index) => {
          const radius = center - strokeWidth / 2 - index * (strokeWidth + gap);
          const circumference = 2 * Math.PI * radius;
          return (
            <G key={ring.key}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={theme.backgroundSelected}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${circumference * ring.value} ${circumference}`}
                fill="none"
                transform={`rotate(-90 ${center} ${center})`}
              />
            </G>
          );
        })}
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
