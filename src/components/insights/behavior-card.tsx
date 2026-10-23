import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { InsightNote } from '@/components/insight-note';
import { SourceBadge } from '@/components/source-badge';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { BEHAVIORS, OUTCOMES, patternTakeaway, type BehaviorPattern } from '@/data/insights';
import { formatDuration, formatSignedMinutes } from '@/data/sleep-math';
import { useTheme } from '@/hooks/use-theme';

const BAR_HEIGHT = 10;

/** Durations read as "7h 3m"; other units stay numeric. */
function formatValue(value: number, unit: string, signed = false) {
  if (unit === 'min')
    return signed ? formatSignedMinutes(value) : formatDuration(Math.round(value));
  const rounded = Math.round(value);
  const sign = signed ? (rounded > 0 ? '+' : rounded < 0 ? '−' : '') : '';
  return `${sign}${Math.abs(rounded)} ${unit}`;
}

/**
 * Nights after a behavior vs. nights without it, for three watch outcomes.
 * Bars start at zero so their lengths stay honest; values sit at the bar tips.
 */
export function BehaviorCard({ pattern }: { pattern: BehaviorPattern }) {
  const theme = useTheme();
  const meta = BEHAVIORS[pattern.behavior];

  return (
    <Card>
      <View style={styles.header}>
        <IconCircle
          icon={meta.icon}
          background={theme.backgroundSelected}
          color={theme.text}
          size={44}
        />
        <View style={styles.flex}>
          <ThemedText type="heading">{meta.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {pattern.nightsWith} nights with · {pattern.nightsWithout} without · {meta.detail}
          </ThemedText>
        </View>
      </View>

      <InsightNote takeaway={patternTakeaway(pattern)} />

      {pattern.early && (
        <View style={[styles.earlyPill, { backgroundColor: theme.yellowSoft }]}>
          <ThemedText type="smallBold">Early pattern: keep logging to see if it holds</ThemedText>
        </View>
      )}

      <View style={styles.legend}>
        <LegendSwatch color={theme.seriesWith} label={`With`} />
        <LegendSwatch color={theme.seriesWithout} label={`Without`} />
      </View>

      <View style={styles.outcomes}>
        {pattern.outcomes.map((o) => {
          const outcome = OUTCOMES[o.outcome];
          const max = Math.max(o.withMean, o.withoutMean);
          const diff = Math.round(o.difference);
          return (
            <View key={o.outcome} style={styles.outcome}>
              <View style={styles.outcomeHeader}>
                <ThemedText type="small" themeColor="textSecondary">
                  {outcome.label}
                </ThemedText>
                <ThemedText type="smallBold">
                  {diff === 0 ? 'No difference' : formatValue(diff, outcome.unit, true)}
                </ThemedText>
              </View>
              <Bar value={o.withMean} max={max} color={theme.seriesWith} unit={outcome.unit} />
              <Bar
                value={o.withoutMean}
                max={max}
                color={theme.seriesWithout}
                unit={outcome.unit}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.sources}>
        <SourceBadge source="journal" />
        <SourceBadge source="watch" />
      </View>
    </Card>
  );
}

function Bar({
  value,
  max,
  color,
  unit,
}: {
  value: number;
  max: number;
  color: string;
  unit: string;
}) {
  return (
    <View style={styles.barRow}>
      {/* The track leaves room for the value label at the tip. */}
      <View style={styles.barTrack}>
        <View style={[styles.bar, { width: `${(value / max) * 100}%`, backgroundColor: color }]} />
      </View>
      <ThemedText type="small" style={styles.barValue}>
        {formatValue(value, unit)}
      </ThemedText>
    </View>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  earlyPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three - Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: 14,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  swatch: {
    width: 12,
    height: 10,
    borderRadius: 3,
  },
  outcomes: {
    gap: Spacing.three,
  },
  outcome: {
    // 2px surface gap between the paired bars.
    gap: 2,
  },
  outcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barTrack: {
    flex: 1,
  },
  bar: {
    height: BAR_HEIGHT,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  barValue: {
    width: 64,
    fontFamily: FontFamily.semibold,
    fontVariant: ['tabular-nums'],
  },
  sources: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
