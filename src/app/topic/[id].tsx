import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { Subpage } from '@/components/subpage';
import { ThemedText } from '@/components/themed-text';
import { VideoPlaceholder } from '@/components/video-placeholder';
import { Palette, Spacing } from '@/constants/theme';
import { buildHistory } from '@/data/history';
import { useCheckIns } from '@/data/journal-store';
import { LEARN_TOPICS } from '@/data/learn';
import { evaluateRules } from '@/data/recommend';
import { useTheme } from '@/hooks/use-theme';

/** One Learn topic: video slot, short explanation, things to try, and how it applies to you. */
export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = LEARN_TOPICS.find((t) => t.id === id) ?? LEARN_TOPICS[0];
  const theme = useTheme();
  const checkIns = useCheckIns();
  const related = evaluateRules(buildHistory(checkIns.morning?.answers), {
    morning: checkIns.morning?.answers,
    evening: checkIns.evening?.answers,
  }).filter((e) => topic.rules.includes(e.id) && e.status === 'fired');

  return (
    <Subpage label="Learn" fallback="/learn">
      <VideoPlaceholder />

      <View style={styles.titleRow}>
        <IconCircle
          icon={topic.icon}
          background={theme.greenSoft}
          color={Palette.green}
          size={44}
        />
        <View style={styles.flex}>
          <ThemedText type="subtitle" style={styles.title}>
            {topic.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {topic.summary}
          </ThemedText>
        </View>
      </View>

      {related.length > 0 && (
        <Card tone="greenSoft">
          <ThemedText type="smallBold" themeColor="accent">
            Why this is in your plan
          </ThemedText>
          {related.map((rule) => (
            <ThemedText key={rule.id} type="small">
              {rule.reason}
            </ThemedText>
          ))}
        </Card>
      )}

      <View style={styles.body}>
        {topic.paragraphs.map((paragraph) => (
          <ThemedText key={paragraph}>{paragraph}</ThemedText>
        ))}
      </View>

      {topic.tips.length > 0 && (
        <Card>
          <ThemedText type="heading">Try this</ThemedText>
          {topic.tips.map((tip) => (
            <View key={tip} style={styles.tip}>
              <View style={[styles.bullet, { backgroundColor: Palette.green }]} />
              <ThemedText type="small" style={styles.flex}>
                {tip}
              </ThemedText>
            </View>
          ))}
        </Card>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
        Educational content, pending clinical review. It isn’t a substitute for advice from your own
        clinician.
      </ThemedText>
    </Subpage>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  body: {
    gap: Spacing.three,
  },
  tip: {
    flexDirection: 'row',
    gap: Spacing.two + Spacing.one,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  footer: {
    textAlign: 'center',
    paddingTop: Spacing.two,
  },
});
