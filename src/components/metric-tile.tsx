import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { SourceBadge } from '@/components/source-badge';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import type { DataSource } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

type MetricTileProps = {
  label: string;
  value: string;
  unit: string;
  /** e.g. "-17% vs usual". */
  comparison: string;
  /** Whether the change is in a direction worth flagging; tints the comparison. */
  flagged?: boolean;
  source: DataSource;
  icon: SymbolViewProps['name'];
  iconColor: string;
  iconBackground: string;
  /** Shown when expanded; the tile then spans the full row. */
  trend?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
};

export function MetricTile({
  label,
  value,
  unit,
  comparison,
  flagged,
  source,
  icon,
  iconColor,
  iconBackground,
  trend,
  expanded = false,
  onToggle,
}: MetricTileProps) {
  const theme = useTheme();
  return (
    <Card style={[styles.tile, expanded && styles.expanded]}>
      {/* Only the summary toggles, so taps inside the chart don't collapse it. */}
      <Pressable
        onPress={onToggle}
        disabled={!onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${label}, ${expanded ? 'hide' : 'show'} trend`}
        style={({ pressed }) => [
          styles.summary,
          expanded && styles.summaryExpanded,
          pressed && styles.pressed,
        ]}>
        <View style={styles.topRow}>
          <IconCircle icon={icon} color={iconColor} background={iconBackground} size={40} />
          {onToggle && (
            <SymbolView
              name={{
                ios: expanded ? 'chevron.up' : 'chart.xyaxis.line',
                android: expanded ? 'expand_less' : 'show_chart',
                web: expanded ? 'expand_less' : 'show_chart',
              }}
              size={18}
              tintColor={theme.textSecondary}
            />
          )}
        </View>
        <View style={expanded && styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            {label}
          </ThemedText>
          <View style={styles.valueRow}>
            <ThemedText style={styles.value}>{value}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {unit}
            </ThemedText>
          </View>
          <ThemedText type="smallBold" themeColor={flagged ? 'warning' : 'textSecondary'}>
            {comparison}
          </ThemedText>
        </View>
      </Pressable>
      {expanded && trend}
      <SourceBadge source={source} />
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    // Two per row; a tile left alone on a row stays half width instead of stretching.
    width: `${50 - 2.2}%`,
    gap: Spacing.two,
  },
  expanded: {
    width: '100%',
    gap: Spacing.three,
  },
  summary: {
    gap: Spacing.two,
  },
  summaryExpanded: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  value: {
    fontFamily: FontFamily.extrabold,
    fontSize: 30,
    lineHeight: 36,
  },
});
