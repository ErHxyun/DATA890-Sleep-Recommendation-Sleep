import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import type { AlignmentRow } from '@/data/alignment';
import { useTheme } from '@/hooks/use-theme';

/** Side-by-side self-report vs. watch for the same night, with the gap between them. */
export function AlignmentCard({ rows }: { rows: AlignmentRow[] }) {
  const theme = useTheme();
  const matches = rows.filter((row) => row.agrees).length;

  return (
    <Card>
      <View>
        <ThemedText type="heading">You vs. your watch</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {matches} of {rows.length} line up with what your watch measured.
        </ThemedText>
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          <View style={styles.labelCell} />
          <ColumnHeader
            label="You"
            icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
          />
          <ColumnHeader
            label="Watch"
            icon={{ ios: 'applewatch', android: 'watch', web: 'watch' }}
          />
        </View>

        {rows.map((row) => (
          <View key={row.id} style={[styles.row, styles.dataRow, { borderTopColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.labelCell}>
              {row.label}
            </ThemedText>
            <ThemedText style={[styles.valueCell, styles.value]}>{row.self}</ThemedText>
            <View style={styles.valueCell}>
              <ThemedText style={styles.value}>{row.watch}</ThemedText>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: row.agrees ? theme.greenSoft : theme.orangeSoft },
                ]}>
                <ThemedText
                  style={[styles.pillText, { color: row.agrees ? theme.positive : theme.warning }]}>
                  {row.agrees ? '≈ match' : `you ${row.difference}`}
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Neither number is “right”. Watches estimate sleep from movement and heart rate, and
        it&apos;s common to misjudge time awake at night. Both are saved with their source, and the
        gaps help personalize your coaching.
      </ThemedText>
    </Card>
  );
}

function ColumnHeader({ label, icon }: { label: string; icon: SymbolViewProps['name'] }) {
  const theme = useTheme();
  return (
    <View style={[styles.valueCell, styles.columnHeader]}>
      <SymbolView name={icon} size={14} tintColor={theme.textSecondary} />
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  table: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  dataRow: {
    borderTopWidth: 1,
    paddingTop: Spacing.two + Spacing.one,
    alignItems: 'flex-start',
  },
  labelCell: {
    flex: 1.1,
  },
  valueCell: {
    flex: 1,
    gap: Spacing.one,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    lineHeight: 16,
  },
});
