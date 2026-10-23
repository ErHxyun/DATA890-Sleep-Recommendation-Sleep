import { router } from 'expo-router';
import { type SymbolViewProps } from 'expo-symbols';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AlignmentCard } from '@/components/alignment-card';
import { Card } from '@/components/card';
import { Hypnogram } from '@/components/hypnogram';
import { InterpretationPanel } from '@/components/interpretation-panel';
import { IconCircle } from '@/components/icon-circle';
import { MetricTile } from '@/components/metric-tile';
import { PrimaryButton } from '@/components/primary-button';
import { RecommendationCard } from '@/components/recommendation-card';
import { RingChart } from '@/components/ring-chart';
import { Screen } from '@/components/screen';
import { SourceBadge } from '@/components/source-badge';
import { ThemedText } from '@/components/themed-text';
import { VitalTrend } from '@/components/vital-trend';
import { FontFamily, Palette, Spacing } from '@/constants/theme';
import { alignMorningCheckIn } from '@/data/alignment';
import { buildHistory, type WatchNight } from '@/data/history';
import { interpretVital, type VitalId } from '@/data/interpretation';
import { useCheckIns } from '@/data/journal-store';
import { lastNight, todaysRecommendation } from '@/data/mock';
import {
  asleepMinutes,
  formatClock,
  formatDuration,
  percentChange,
  sleepEfficiency,
  stageMinutes,
  usualRange,
} from '@/data/sleep-math';
import type { SleepStage } from '@/data/types';
import { useStageColors } from '@/hooks/use-stage-colors';
import { useTheme } from '@/hooks/use-theme';

/** Nights shown in each vital's trend. */
const TREND_NIGHTS = 14;

const STAGES: {
  stage: Exclude<SleepStage, 'awake'>;
  label: string;
  icon: SymbolViewProps['name'];
}[] = [
  {
    stage: 'deep',
    label: 'Deep',
    icon: { ios: 'moon.zzz.fill', android: 'bedtime', web: 'bedtime' },
  },
  {
    stage: 'core',
    label: 'Core',
    icon: { ios: 'water.waves', android: 'waves', web: 'waves' },
  },
  {
    stage: 'rem',
    label: 'REM',
    icon: { ios: 'eye.fill', android: 'visibility', web: 'visibility' },
  },
];

export default function TodayScreen() {
  const theme = useTheme();
  const stageColors = useStageColors();
  const checkIns = useCheckIns();
  const [expandedVital, setExpandedVital] = useState<VitalId | null>(null);
  const history = buildHistory(checkIns.morning?.answers);
  const trendNights = history.slice(-TREND_NIGHTS);

  /** Last night vs. the usual range of the nights before it, for one vital. */
  function compare(pick: (w: WatchNight) => number, describe: (delta: number) => string) {
    const values = trendNights.map((n) => pick(n.watch));
    const latest = values[values.length - 1];
    const range = usualRange(values.slice(0, -1));
    const outside = latest < range.low || latest > range.high;
    return {
      comparison: outside ? `${describe(latest - range.mean)} vs usual` : 'In your usual range',
      flagged: outside,
    };
  }

  const vitals: {
    id: VitalId;
    pick: (w: WatchNight) => number;
    format: (value: number) => string;
    tile: Omit<ComponentProps<typeof MetricTile>, 'source'>;
  }[] = [
    {
      id: 'hrv',
      pick: (w) => w.hrvSdnnMs,
      format: (v) => `${Math.round(v)} ms`,
      tile: {
        label: 'HRV (SDNN)',
        value: `${lastNight.hrvSdnnMs}`,
        unit: 'ms',
        ...compare(
          (w) => w.hrvSdnnMs,
          (d) => percentChange(lastNight.hrvSdnnMs, lastNight.hrvSdnnMs - d),
        ),
        icon: { ios: 'waveform.path.ecg', android: 'ecg_heart', web: 'ecg_heart' },
        iconColor: Palette.lavender,
        iconBackground: theme.lavenderSoft,
      },
    },
    {
      id: 'restingHr',
      pick: (w) => w.restingHr,
      format: (v) => `${Math.round(v)} bpm`,
      tile: {
        label: 'Resting heart rate',
        value: `${lastNight.restingHr}`,
        unit: 'bpm',
        ...compare(
          (w) => w.restingHr,
          (d) => `${d > 0 ? '+' : '−'}${Math.abs(Math.round(d))} bpm`,
        ),
        icon: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
        iconColor: Palette.orange,
        iconBackground: theme.orangeSoft,
      },
    },
    {
      id: 'respiratory',
      pick: (w) => w.respiratoryRate,
      format: (v) => `${v.toFixed(1)} br/min`,
      tile: {
        label: 'Respiratory rate',
        value: lastNight.respiratoryRate.toFixed(1),
        unit: 'br/min',
        ...compare(
          (w) => w.respiratoryRate,
          (d) => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} br/min`,
        ),
        icon: { ios: 'lungs.fill', android: 'pulmonology', web: 'pulmonology' },
        iconColor: Palette.green,
        iconBackground: theme.greenSoft,
      },
    },
    {
      id: 'wristTemp',
      pick: (w) => w.wristTempDeltaC,
      format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} °C`,
      tile: {
        label: 'Wrist temp',
        value: `${lastNight.wristTempDeltaC > 0 ? '+' : ''}${lastNight.wristTempDeltaC.toFixed(1)}`,
        unit: '°C',
        ...compare(
          (w) => w.wristTempDeltaC,
          (d) => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} °C`,
        ),
        icon: { ios: 'thermometer.medium', android: 'thermometer', web: 'thermometer' },
        iconColor: '#C99A1E',
        iconBackground: theme.yellowSoft,
      },
    },
  ];
  const asleep = asleepMinutes(lastNight);
  const totals = stageMinutes(lastNight);
  const efficiency = Math.round(sleepEfficiency(lastNight) * 100);
  const dateLabel = lastNight.wakeDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Screen title="Good morning" subtitle={dateLabel}>
      {/* Last night's watch data stays hidden until the user has given their own account of it. */}
      {!checkIns.morning ? (
        <Card style={styles.hero}>
          <View style={styles.lockedIcon}>
            <IconCircle
              icon={{
                ios: 'sun.horizon.fill',
                android: 'wb_twilight',
                web: 'wb_twilight',
              }}
              background={Palette.yellow}
              color={Palette.brown}
              size={96}
            />
          </View>
          <ThemedText type="subtitle" style={styles.center}>
            How did you sleep?
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={[styles.center, styles.lockedText]}>
            Tell us how last night felt first. Then we&apos;ll show what your Apple Watch measured,
            side by side with your answers.
          </ThemedText>
          <PrimaryButton
            label="Start morning check-in"
            onPress={() =>
              router.push({
                pathname: '/check-in/[kind]',
                params: { kind: 'morning' },
              })
            }
          />
        </Card>
      ) : (
        <Card style={styles.hero}>
          <ThemedText type="heading" style={styles.center}>
            You slept for
          </ThemedText>
          <View style={styles.hoursRow}>
            <ThemedText style={styles.hours}>{(asleep / 60).toFixed(1)}</ThemedText>
            <ThemedText style={[styles.hoursUnit, { color: theme.textSecondary }]}>h</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {formatClock(lastNight.inBedStart)} – {formatClock(lastNight.inBedEnd)} · {efficiency}%
            efficiency
          </ThemedText>

          <View style={styles.ringWrap}>
            <RingChart
              rings={STAGES.map(({ stage }) => ({
                key: stage,
                color: stageColors[stage],
                value: totals[stage] / asleep,
              }))}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Awake
              </ThemedText>
              <ThemedText type="heading">{formatDuration(totals.awake)}</ThemedText>
            </RingChart>
          </View>

          <View style={styles.stageRow}>
            {STAGES.map(({ stage, label, icon }) => (
              <View key={stage} style={styles.stage}>
                <ThemedText type="small" themeColor="textSecondary">
                  {label}
                </ThemedText>
                <ThemedText style={styles.stageValue}>{formatDuration(totals[stage])}</ThemedText>
                <IconCircle
                  icon={icon}
                  background={stageColors[stage]}
                  color={stage === 'rem' ? Palette.brown : '#FFFFFF'}
                  size={48}
                />
              </View>
            ))}
          </View>
        </Card>
      )}

      {checkIns.morning && (
        <AlignmentCard rows={alignMorningCheckIn(checkIns.morning.answers, lastNight)} />
      )}

      <RecommendationCard recommendation={todaysRecommendation} />

      <ThemedText type="heading" style={styles.sectionLabel}>
        Overnight vitals
      </ThemedText>
      <View style={styles.grid}>
        {vitals.map((vital) => (
          <MetricTile
            key={vital.id}
            {...vital.tile}
            source="watch"
            expanded={expandedVital === vital.id}
            onToggle={() => setExpandedVital((current) => (current === vital.id ? null : vital.id))}
            trend={
              <>
                <VitalTrend
                  points={trendNights.map((n) => ({ date: n.date, value: vital.pick(n.watch) }))}
                  format={vital.format}
                />
                <InterpretationPanel
                  interpretation={interpretVital({
                    id: vital.id,
                    pick: vital.pick,
                    format: vital.format,
                    trendNights,
                    allNights: history,
                  })}
                />
              </>
            }
          />
        ))}
      </View>

      {checkIns.morning && (
        <Card>
          <View style={styles.cardHeader}>
            <ThemedText type="heading">Sleep timeline</ThemedText>
            <SourceBadge source="watch" />
          </View>
          <Hypnogram night={lastNight} />
        </Card>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
        Sleep by Science offers behavioral sleep coaching and is not a medical device. Wearable
        sleep stages are estimates and can differ from a clinical sleep study.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  hero: {
    alignItems: 'stretch',
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  hours: {
    fontFamily: FontFamily.extrabold,
    fontSize: 64,
    lineHeight: 72,
  },
  hoursUnit: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
  },
  lockedIcon: {
    alignItems: 'center',
    paddingBottom: Spacing.three,
  },
  lockedText: {
    paddingBottom: Spacing.four,
  },
  ringWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Spacing.four,
  },
  stage: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  stageValue: {
    fontFamily: FontFamily.extrabold,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: Spacing.two,
  },
  sectionLabel: {
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
