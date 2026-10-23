import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { usualRange } from '@/data/sleep-math';
import { useTheme } from '@/hooks/use-theme';

export type TrendPoint = { date: Date; value: number };

const PLOT_HEIGHT = 120;
const AXIS_HEIGHT = 20;
const LEFT = 34;
const RIGHT = 10;
const TOP = 10;

const shortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * One vital over recent nights, with the user's usual range (mean ± 1 SD of the
 * nights before the latest) as a band, so last night's deviation reads at a glance.
 * Single series, so no legend box: the tile it sits in names the metric.
 */
export function VitalTrend({
  points,
  format,
}: {
  points: TrendPoint[];
  /** Formats a value with its unit, e.g. "39 ms". */
  format: (value: number) => string;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(points.length - 1);
  const [showTable, setShowTable] = useState(false);

  const { low: usualLow, high: usualHigh } = usualRange(points.slice(0, -1).map((p) => p.value));

  const values = points.map((p) => p.value);
  const pad = (Math.max(...values) - Math.min(...values)) * 0.15 || 1;
  const min = Math.min(...values, usualLow) - pad;
  const max = Math.max(...values, usualHigh) + pad;

  const plotWidth = Math.max(0, width - LEFT - RIGHT);
  const step = plotWidth / Math.max(1, points.length - 1);
  const x = (i: number) => LEFT + step * i;
  const y = (v: number) => TOP + (1 - (v - min) / (max - min)) * (PLOT_HEIGHT - TOP);
  const ticks = [min + pad, (min + max) / 2, max - pad];

  const point = points[selected];
  const last = points[points.length - 1];
  const inRange = (v: number) => v >= usualLow && v <= usualHigh;

  return (
    <View style={styles.container}>
      <View style={styles.readout}>
        <ThemedText style={styles.readoutValue}>{format(point.value)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {selected === points.length - 1 ? 'Last night' : shortDate(point.date)} ·{' '}
          {inRange(point.value) ? 'within your usual range' : 'outside your usual range'}
        </ThemedText>
      </View>

      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={PLOT_HEIGHT + AXIS_HEIGHT}>
            <Rect
              x={LEFT}
              y={y(usualHigh)}
              width={plotWidth}
              height={y(usualLow) - y(usualHigh)}
              fill={theme.seriesWatch}
              fillOpacity={0.1}
              rx={4}
            />
            {ticks.map((tick) => (
              <SvgText
                key={tick}
                x={LEFT - 6}
                y={y(tick) + 4}
                fontSize={10}
                fontFamily={FontFamily.medium}
                fill={theme.textSecondary}
                textAnchor="end">
                {format(tick).split(' ')[0]}
              </SvgText>
            ))}
            <Line
              x1={LEFT}
              x2={width - RIGHT}
              y1={PLOT_HEIGHT}
              y2={PLOT_HEIGHT}
              stroke={theme.gridline}
              strokeWidth={1}
            />
            <Line
              x1={x(selected)}
              x2={x(selected)}
              y1={TOP}
              y2={PLOT_HEIGHT}
              stroke={theme.textSecondary}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
            <Polyline
              points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')}
              fill="none"
              stroke={theme.seriesWatch}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Selected point and the latest night get a ringed marker. */}
            {[...new Set([selected, points.length - 1])].map((i) => (
              <Circle
                key={i}
                cx={x(i)}
                cy={y(points[i].value)}
                r={4.5}
                fill={theme.seriesWatch}
                stroke={theme.backgroundElement}
                strokeWidth={2}
              />
            ))}
            <SvgText
              x={LEFT}
              y={PLOT_HEIGHT + 15}
              fontSize={10}
              fontFamily={FontFamily.medium}
              fill={theme.textSecondary}>
              {shortDate(points[0].date)}
            </SvgText>
            <SvgText
              x={width - RIGHT}
              y={PLOT_HEIGHT + 15}
              fontSize={10}
              fontFamily={FontFamily.medium}
              fill={theme.textSecondary}
              textAnchor="end">
              {shortDate(last.date)}
            </SvgText>
          </Svg>
        )}
        {/* Each night's column is its hit target. */}
        {width > 0 &&
          points.map((p, i) => (
            <Pressable
              key={p.date.toISOString()}
              accessibilityLabel={`Show ${shortDate(p.date)}`}
              onPressIn={() => setSelected(i)}
              onHoverIn={() => setSelected(i)}
              style={[styles.hit, { left: x(i) - step / 2, width: step }]}
            />
          ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.legendItem}>
          <View style={[styles.band, { backgroundColor: theme.seriesWatch }]} />
          <ThemedText type="small" themeColor="textSecondary">
            Your usual range {format(usualLow).split(' ')[0]}–{format(usualHigh)}
          </ThemedText>
        </View>
        <Pressable onPress={() => setShowTable((value) => !value)}>
          <ThemedText type="smallBold" themeColor="accent">
            {showTable ? 'Hide table' : 'Table'}
          </ThemedText>
        </Pressable>
      </View>

      {showTable && (
        <View>
          {[...points].reverse().map((p) => (
            <View
              key={p.date.toISOString()}
              style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {shortDate(p.date)}
              </ThemedText>
              <ThemedText type="small" style={styles.numeric}>
                {format(p.value)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  readout: {
    gap: 0,
  },
  readoutValue: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  hit: {
    position: 'absolute',
    top: 0,
    height: PLOT_HEIGHT,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  band: {
    width: 14,
    height: 10,
    borderRadius: 3,
    opacity: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: Spacing.one + Spacing.half,
  },
  numeric: {
    fontVariant: ['tabular-nums'],
  },
});
