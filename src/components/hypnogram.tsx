import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatClock } from '@/data/sleep-math';
import type { NightSummary, SleepStage } from '@/data/types';
import { useStageColors } from '@/hooks/use-stage-colors';
import { useTheme } from '@/hooks/use-theme';

const ROWS: { stage: SleepStage; label: string }[] = [
  { stage: 'awake', label: 'Awake' },
  { stage: 'rem', label: 'REM' },
  { stage: 'core', label: 'Core' },
  { stage: 'deep', label: 'Deep' },
];

/** Stage-by-time chart, one lane per stage like Apple Health's sleep view. */
export function Hypnogram({ night }: { night: NightSummary }) {
  const theme = useTheme();
  const stageColors = useStageColors();
  const start = night.inBedStart.getTime();
  const span = night.inBedEnd.getTime() - start;

  return (
    <View style={styles.container}>
      {ROWS.map(({ stage, label }) => (
        <View key={stage} style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
            {label}
          </ThemedText>
          <View style={[styles.lane, { backgroundColor: theme.background }]}>
            {night.segments
              .filter((segment) => segment.stage === stage)
              .map((segment) => (
                <View
                  key={segment.start.toISOString()}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: stageColors[stage],
                      left: `${((segment.start.getTime() - start) / span) * 100}%`,
                      width: `${((segment.end.getTime() - segment.start.getTime()) / span) * 100}%`,
                    },
                  ]}
                />
              ))}
          </View>
        </View>
      ))}

      <View style={styles.axis}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatClock(night.inBedStart)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatClock(night.inBedEnd)}
        </ThemedText>
      </View>
    </View>
  );
}

const LABEL_WIDTH = 48;

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    width: LABEL_WIDTH,
  },
  lane: {
    flex: 1,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    minWidth: 6,
    borderRadius: 9,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: LABEL_WIDTH,
  },
});
