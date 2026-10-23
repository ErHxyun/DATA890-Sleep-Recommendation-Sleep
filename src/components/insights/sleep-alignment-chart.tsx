import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import type { NightRecord } from '@/data/history';
import { formatDuration, formatSignedMinutes } from '@/data/sleep-math';
import { useTheme } from '@/hooks/use-theme';

const PLOT_HEIGHT = 170;
const AXIS_HEIGHT = 22;
const LEFT = 30;
const RIGHT = 6;
const TOP = 8;
const DOT_R = 4.5;

const shortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Dumbbell chart: per night, the watch's total sleep and the user's own estimate,
 * joined by a line whose length is the gap. Tap a night to read its values.
 */
export function SleepAlignmentChart({ nights }: { nights: NightRecord[] }) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(nights.length - 1);
  const [showTable, setShowTable] = useState(false);
  const index = Math.min(selected, nights.length - 1);

  const values = nights.flatMap((night) => [
    night.watch.asleepMinutes,
    ...(night.self ? [night.self.totalSleepMinutes] : []),
  ]);
  const minHour = Math.floor(Math.min(...values) / 60);
  const maxHour = Math.ceil(Math.max(...values) / 60);
  const ticks = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  const plotWidth = Math.max(0, width - LEFT - RIGHT);
  const band = plotWidth / nights.length;
  const x = (i: number) => LEFT + band * (i + 0.5);
  const y = (minutes: number) =>
    TOP + (1 - (minutes / 60 - minHour) / (maxHour - minHour)) * (PLOT_HEIGHT - TOP);

  const night = nights[index];
  const gap = night.self ? night.self.totalSleepMinutes - night.watch.asleepMinutes : null;

  const labelEvery = nights.length <= 7 ? 1 : nights.length <= 14 ? 3 : 7;

  return (
    <View style={styles.container}>
      {/* Readout for the selected night: values lead, series names follow. */}
      <View style={styles.readout}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {index === nights.length - 1 ? 'Last night' : shortDate(night.date)}
        </ThemedText>
        <View style={styles.readoutRow}>
          <ReadoutValue
            color={theme.seriesSelf}
            label="You"
            value={night.self ? formatDuration(night.self.totalSleepMinutes) : 'No check-in'}
          />
          <ReadoutValue
            color={theme.seriesWatch}
            label="Watch"
            value={formatDuration(night.watch.asleepMinutes)}
          />
          <View>
            <ThemedText style={styles.readoutValue}>
              {gap === null ? '—' : formatSignedMinutes(gap)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Gap
            </ThemedText>
          </View>
        </View>
      </View>

      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={PLOT_HEIGHT + AXIS_HEIGHT}>
            {ticks.map((hour) => (
              <Line
                key={hour}
                x1={LEFT}
                x2={width - RIGHT}
                y1={y(hour * 60)}
                y2={y(hour * 60)}
                stroke={theme.gridline}
                strokeWidth={1}
              />
            ))}
            {ticks.map((hour) => (
              <SvgText
                key={`label-${hour}`}
                x={LEFT - 6}
                y={y(hour * 60) + 4}
                fontSize={11}
                fontFamily={FontFamily.medium}
                fill={theme.textSecondary}
                textAnchor="end">
                {`${hour}h`}
              </SvgText>
            ))}

            {/* Crosshair on the selected night. */}
            <Line
              x1={x(index)}
              x2={x(index)}
              y1={TOP}
              y2={PLOT_HEIGHT}
              stroke={theme.textSecondary}
              strokeOpacity={0.35}
              strokeWidth={1}
            />

            {nights.map((n, i) => {
              const watchY = y(n.watch.asleepMinutes);
              const selfY = n.self ? y(n.self.totalSleepMinutes) : null;
              const dim = i === index ? 1 : 0.55;
              return (
                <G key={n.date.toISOString()}>
                  {selfY !== null && (
                    <Line
                      x1={x(i)}
                      x2={x(i)}
                      y1={watchY}
                      y2={selfY}
                      stroke={theme.textSecondary}
                      strokeOpacity={0.4 * dim}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}
                  <Circle
                    cx={x(i)}
                    cy={watchY}
                    r={DOT_R}
                    fill={theme.seriesWatch}
                    fillOpacity={dim}
                    stroke={theme.backgroundElement}
                    strokeWidth={2}
                  />
                  {selfY !== null && (
                    <Circle
                      cx={x(i)}
                      cy={selfY}
                      r={DOT_R}
                      fill={theme.seriesSelf}
                      fillOpacity={dim}
                      stroke={theme.backgroundElement}
                      strokeWidth={2}
                    />
                  )}
                </G>
              );
            })}

            {nights.map((n, i) =>
              i % labelEvery === (nights.length - 1) % labelEvery ? (
                <SvgText
                  key={`x-${i}`}
                  x={x(i)}
                  y={PLOT_HEIGHT + 16}
                  fontSize={11}
                  fontFamily={FontFamily.medium}
                  fill={theme.textSecondary}
                  // Edge labels hug the plot so they aren't clipped by the card.
                  textAnchor={
                    nights.length <= 7
                      ? 'middle'
                      : i === nights.length - 1
                        ? 'end'
                        : i < labelEvery
                          ? 'start'
                          : 'middle'
                  }>
                  {nights.length <= 7
                    ? n.date.toLocaleDateString('en-US', { weekday: 'narrow' })
                    : shortDate(n.date)}
                </SvgText>
              ) : null,
            )}
          </Svg>
        )}
        {/* Each night's full column is its hit target, so readers aim at a date, not a dot. */}
        {width > 0 &&
          nights.map((n, i) => (
            <Pressable
              key={`hit-${n.date.toISOString()}`}
              accessibilityLabel={`Show ${shortDate(n.date)}`}
              onPressIn={() => setSelected(i)}
              onHoverIn={() => setSelected(i)}
              style={[styles.hit, { left: LEFT + band * i, width: band }]}
            />
          ))}
      </View>

      <View style={styles.legend}>
        <LegendDot color={theme.seriesSelf} label="Your estimate" />
        <LegendDot color={theme.seriesWatch} label="Apple Watch" />
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: theme.textSecondary }]} />
          <ThemedText type="small" themeColor="textSecondary">
            Gap
          </ThemedText>
        </View>
      </View>

      <Pressable onPress={() => setShowTable((value) => !value)} style={styles.tableToggle}>
        <ThemedText type="smallBold" themeColor="accent">
          {showTable ? 'Hide table' : 'View as table'}
        </ThemedText>
      </Pressable>

      {showTable && (
        <View>
          <TableRow cells={['Night', 'You', 'Watch', 'Gap']} header />
          {[...nights].reverse().map((n) => (
            <TableRow
              key={n.date.toISOString()}
              cells={[
                shortDate(n.date),
                n.self ? formatDuration(n.self.totalSleepMinutes) : '—',
                formatDuration(n.watch.asleepMinutes),
                n.self
                  ? formatSignedMinutes(n.self.totalSleepMinutes - n.watch.asleepMinutes)
                  : '—',
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ReadoutValue({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View>
      <ThemedText style={styles.readoutValue}>{value}</ThemedText>
      <View style={styles.legendItem}>
        <View style={[styles.lineKey, { backgroundColor: color }]} />
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function TableRow({ cells, header }: { cells: string[]; header?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
      {cells.map((cell, i) => (
        <ThemedText
          key={i}
          type={header ? 'smallBold' : 'small'}
          themeColor={header ? 'textSecondary' : 'text'}
          style={[styles.tableCell, i > 0 && styles.numeric]}>
          {cell}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  readout: {
    gap: Spacing.one,
  },
  readoutRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  readoutValue: {
    fontFamily: FontFamily.extrabold,
    fontSize: 20,
    lineHeight: 26,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  lineKey: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  legendLine: {
    width: 2,
    height: 12,
    borderRadius: 1,
    opacity: 0.5,
  },
  hit: {
    position: 'absolute',
    top: 0,
    height: PLOT_HEIGHT,
  },
  tableToggle: {
    alignSelf: 'flex-start',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
  },
  tableCell: {
    flex: 1,
  },
  numeric: {
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
