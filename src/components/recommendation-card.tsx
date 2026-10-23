import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { SourceBadge } from '@/components/source-badge';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import type { Recommendation } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

/**
 * A coaching recommendation that can always answer "why this, for me?":
 * the personal pattern, the data sources behind it, and the published evidence.
 */
export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  return (
    <Card tone="greenSoft">
      <View style={styles.header}>
        <IconCircle
          icon={{ ios: 'leaf.fill', android: 'spa', web: 'spa' }}
          background={Palette.green}
          color="#FFFFFF"
          size={40}
        />
        <View style={styles.flex}>
          <ThemedText type="smallBold" themeColor="accent">
            Today&apos;s focus
          </ThemedText>
          <ThemedText type="heading">{recommendation.title}</ThemedText>
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {recommendation.action}
      </ThemedText>

      <Pressable
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [
          styles.toggle,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold">
          {expanded ? 'Hide details' : 'Why am I seeing this?'}
        </ThemedText>
        <SymbolView
          name={{
            ios: expanded ? 'chevron.up' : 'chevron.down',
            android: expanded ? 'expand_less' : 'expand_more',
            web: expanded ? 'expand_less' : 'expand_more',
          }}
          size={16}
          tintColor={theme.text}
        />
      </Pressable>

      {expanded && (
        <View style={[styles.details, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.section}>
            <ThemedText type="smallBold">In your data</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {recommendation.why}
            </ThemedText>
            <View style={styles.badges}>
              {recommendation.sources.map((source) => (
                <SourceBadge key={source} source={source} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">What the research says</ThemedText>
            {recommendation.evidence.map((item) => (
              <View
                key={item.citation}
                style={[styles.evidence, { borderLeftColor: Palette.green }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.finding}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.citation}>
                  {item.citation}
                </ThemedText>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.reviewPill,
              {
                backgroundColor:
                  recommendation.clinicalReview === 'reviewed' ? theme.greenSoft : theme.orangeSoft,
              },
            ]}>
            <ThemedText
              type="smallBold"
              themeColor={recommendation.clinicalReview === 'reviewed' ? 'positive' : 'warning'}>
              {recommendation.clinicalReview === 'reviewed'
                ? '✓ Reviewed by a clinician'
                : '● Pending clinical review'}
            </ThemedText>
          </View>
        </View>
      )}

      <View style={styles.feedback}>
        <ThemedText type="small" themeColor="textSecondary">
          Is this helpful?
        </ThemedText>
        <View style={styles.feedbackButtons}>
          <FeedbackButton
            active={feedback === 'up'}
            icon={{ ios: 'hand.thumbsup', android: 'thumb_up', web: 'thumb_up' }}
            onPress={() => setFeedback('up')}
          />
          <FeedbackButton
            active={feedback === 'down'}
            icon={{ ios: 'hand.thumbsdown', android: 'thumb_down', web: 'thumb_down' }}
            onPress={() => setFeedback('down')}
          />
        </View>
      </View>
    </Card>
  );
}

function FeedbackButton({
  active,
  icon,
  onPress,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof SymbolView>['name'];
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.feedbackButton,
        { backgroundColor: active ? theme.primary : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} size={18} tintColor={active ? theme.onPrimary : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: 22,
  },
  pressed: {
    opacity: 0.7,
  },
  details: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
  },
  section: {
    gap: Spacing.two,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  evidence: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.two + Spacing.one,
    gap: Spacing.half,
  },
  citation: {
    fontSize: 12,
  },
  reviewPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 16,
  },
  feedback: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  feedbackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
