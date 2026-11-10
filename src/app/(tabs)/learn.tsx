import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { buildHistory } from '@/data/history';
import { useCheckIns } from '@/data/journal-store';
import { LEARN_TOPICS, type LearnTopic } from '@/data/learn';
import { evaluateRules } from '@/data/recommend';
import { useTheme } from '@/hooks/use-theme';

/** Topics as a two-column grid; each opens its own page with the video and full text. */
export default function LearnScreen() {
  const theme = useTheme();
  const checkIns = useCheckIns();
  const fired = new Set(
    evaluateRules(buildHistory(checkIns.morning?.answers), {
      morning: checkIns.morning?.answers,
      evening: checkIns.evening?.answers,
    })
      .filter((e) => e.status === 'fired')
      .map((e) => e.id),
  );
  const forYou = LEARN_TOPICS.filter((t) => t.rules.some((rule) => fired.has(rule)));
  const rest = LEARN_TOPICS.filter((t) => !forYou.includes(t));

  return (
    <Screen title="Learn" subtitle="How sleep works">
      <Pressable
        onPress={() => router.push('/guide')}
        accessibilityRole="button"
        style={({ pressed }) => pressed && styles.pressed}>
        <Card style={styles.guideCard}>
          <IconCircle
            icon={{ ios: 'questionmark', android: 'question_mark', web: 'question_mark' }}
            background={theme.primary}
            color={theme.onPrimary}
            size={40}
          />
          <View style={styles.flex}>
            <ThemedText type="smallBold">New here? How to use Sleep by Science</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Getting started, how to track, and what each screen does.
            </ThemedText>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            tintColor={theme.textSecondary}
          />
        </Card>
      </Pressable>

      {forYou.length > 0 && (
        <>
          <ThemedText type="heading">For you right now</ThemedText>
          <TopicGrid topics={forYou} highlighted />
        </>
      )}
      <ThemedText type="heading" style={styles.sectionTitle}>
        All topics
      </ThemedText>
      <TopicGrid topics={rest} />
    </Screen>
  );
}

function TopicGrid({
  topics,
  highlighted = false,
}: {
  topics: LearnTopic[];
  highlighted?: boolean;
}) {
  return (
    <View style={styles.grid}>
      {topics.map((topic) => (
        <TopicTile key={topic.id} topic={topic} highlighted={highlighted} />
      ))}
    </View>
  );
}

function TopicTile({ topic, highlighted }: { topic: LearnTopic; highlighted: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/topic/[id]', params: { id: topic.id } })}
      accessibilityRole="button"
      accessibilityLabel={topic.title}
      style={({ pressed }) => [styles.tileWrap, pressed && styles.pressed]}>
      <Card tone={highlighted ? 'greenSoft' : 'backgroundElement'} style={styles.tile}>
        <IconCircle
          icon={topic.icon}
          background={highlighted ? Palette.green : theme.backgroundSelected}
          color={highlighted ? '#FFFFFF' : theme.text}
          size={40}
        />
        <View style={styles.tileText}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {topic.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {topic.summary}
          </ThemedText>
        </View>
        <View style={styles.videoTag}>
          <SymbolView
            name={{ ios: 'play.circle', android: 'play_circle', web: 'play_circle' }}
            size={14}
            tintColor={theme.textSecondary}
          />
          <ThemedText style={styles.videoText} themeColor="textSecondary">
            Video soon
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.three,
  },
  tileWrap: {
    width: '48%',
  },
  pressed: {
    opacity: 0.8,
  },
  tile: {
    gap: Spacing.two,
    padding: Spacing.three,
    minHeight: 172,
  },
  tileText: {
    flex: 1,
    gap: Spacing.half,
  },
  videoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  videoText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
