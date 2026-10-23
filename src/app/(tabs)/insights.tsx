import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { InsightNote } from '@/components/insight-note';
import { BehaviorCard } from '@/components/insights/behavior-card';
import { RangeControl } from '@/components/insights/range-control';
import { SleepAlignmentChart } from '@/components/insights/sleep-alignment-chart';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { buildHistory } from '@/data/history';
import {
  alignmentSummary,
  alignmentTakeaway,
  behaviorPatterns,
  BEHAVIORS,
  MIN_EFFECT,
  patternStrength,
  type AlignmentMetric,
} from '@/data/insights';
import { useCheckIns } from '@/data/journal-store';
import { formatDuration, formatSignedMinutes } from '@/data/sleep-math';
import { useTheme } from '@/hooks/use-theme';

const RANGES = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 28, label: '4 weeks' },
];

export default function InsightsScreen() {
  const checkIns = useCheckIns();
  const [range, setRange] = useState(14);

  const history = useMemo(() => buildHistory(checkIns.morning?.answers), [checkIns.morning]);
  const nights = history.slice(-range);
  const alignment = alignmentSummary(nights);
  const patterns = behaviorPatterns(nights);
  const clear = patterns.filter((p) => patternStrength(p) >= MIN_EFFECT);
  const unclear = patterns.filter((p) => patternStrength(p) < MIN_EFFECT);

  const totalSleep = alignment.find((metric) => metric.id === 'totalSleep') as AlignmentMetric;
  const avgSleep = nights.reduce((sum, n) => sum + n.watch.asleepMinutes, 0) / nights.length;
  const checkInCount = nights.filter((n) => n.self !== null).length;

  return (
    <Screen title="Insights" subtitle={`Your last ${range} nights`}>
      <RangeControl options={RANGES} value={range} onChange={setRange} />

      <View style={styles.tiles}>
        <StatTile label="Avg sleep" value={formatDuration(Math.round(avgSleep))} note="by watch" />
        <StatTile label="Check-ins" value={`${checkInCount}/${nights.length}`} note="mornings" />
        <StatTile
          label="Your gap"
          value={formatSignedMinutes(totalSleep.meanGap)}
          note="avg vs watch"
        />
      </View>

      <ThemedText type="heading" style={styles.sectionTitle}>
        You vs. your watch
      </ThemedText>
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          Total sleep each night, as you remembered it and as your watch measured it.
        </ThemedText>
        <SleepAlignmentChart key={range} nights={nights} />
        <InsightNote
          takeaway={alignmentTakeaway(nights)}
          howToRead="Each column is one night. The orange dot is your own estimate from the morning check-in, and the purple dot is what your watch measured. The longer the line between them, the bigger the gap. Tap a night to see its numbers."
        />
      </Card>

      <Card>
        <View>
          <ThemedText type="heading">How well they line up</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Nights where your answer and the watch agreed, out of nights with both.
          </ThemedText>
        </View>
        {alignment.map((metric) => (
          <AgreementRow key={metric.id} metric={metric} />
        ))}
        <ThemedText type="small" themeColor="textSecondary">
          A steady gap in one direction is common and worth knowing about. People often
          underestimate how long they sleep when sleep feels poor, and watches can miss quiet
          wakefulness.
        </ThemedText>
      </Card>

      <ThemedText type="heading" style={styles.sectionTitle}>
        Habits × sleep
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionBody}>
        Habits from your evening check-ins, compared with what your watch measured that night.
        Strongest patterns first.
      </ThemedText>
      {clear.map((pattern) => (
        <BehaviorCard key={pattern.behavior} pattern={pattern} />
      ))}
      {unclear.length > 0 && (
        <Card>
          <ThemedText type="smallBold">No clear difference yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {unclear.map((p) => BEHAVIORS[p.behavior].label).join(', ')}: your sleep looked about
            the same on nights with and without.
          </ThemedText>
        </Card>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
        These are patterns in your own data, not proof that one thing causes another. Your coaching
        uses them alongside published sleep research.
      </ThemedText>
    </Screen>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card style={styles.tile}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.tileValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {note}
      </ThemedText>
    </Card>
  );
}

function AgreementRow({ metric }: { metric: AlignmentMetric }) {
  const theme = useTheme();
  const share = metric.nights ? metric.agreeing / metric.nights : 0;
  const gap =
    metric.unit === 'minutes'
      ? formatSignedMinutes(metric.meanGap)
      : `${metric.meanGap > 0 ? '+' : metric.meanGap < 0 ? '−' : ''}${Math.abs(metric.meanGap).toFixed(1)}×`;

  return (
    <View style={styles.agreement}>
      <View style={styles.agreementHeader}>
        <ThemedText type="smallBold">{metric.label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {metric.agreeing}/{metric.nights} nights · you {gap}
        </ThemedText>
      </View>
      {/* Meter: the track is a lighter step of the fill's own ramp. */}
      <View style={[styles.meterTrack, { backgroundColor: theme.greenSoft }]}>
        <View
          style={[
            styles.meterFill,
            { width: `${share * 100}%`, backgroundColor: theme.seriesWith },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three - Spacing.one,
    borderRadius: 22,
  },
  tileValue: {
    fontFamily: FontFamily.extrabold,
    fontSize: 19,
    lineHeight: 26,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  sectionBody: {
    marginTop: -Spacing.two,
  },
  agreement: {
    gap: Spacing.one + Spacing.half,
  },
  agreementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  meterTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  disclaimer: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
