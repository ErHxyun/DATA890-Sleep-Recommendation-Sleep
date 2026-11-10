import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useTour, type Rect } from './tour-context';

/** Space kept around the highlighted element. */
const PADDING = 8;
const RADIUS = 20;
const CARD_MAX_WIDTH = 340;
const GAP = 14;
/** Room the card needs below a target before it flips above it. */
const CARD_ROOM = 220;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Rectangle with a rounded hole, drawn with the even-odd rule so the hole stays clear. */
function spotlightPath(width: number, height: number, hole: Rect) {
  const { x, y, width: w, height: h } = hole;
  const r = Math.min(RADIUS, w / 2, h / 2);
  return [
    `M0 0H${width}V${height}H0Z`,
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`,
  ].join('');
}

/**
 * Full-screen coach-mark layer: dims everything except the current step's target and
 * shows a card next to it. Sits above the tabs, so it's rendered once at the root.
 */
export function TourOverlay() {
  const tour = useTour();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  // The measured spotlight, tagged with its step so a new step never shows the old one.
  const [measured, setMeasured] = useState<{ index: number; rect: Rect | null } | null>(null);
  const step = tour.step;

  // Bring the target into view, then measure where it ended up.
  useEffect(() => {
    if (!step) return;
    let cancelled = false;
    (async () => {
      const target = step.target;
      let rect = target ? await target.measure() : null;
      if (rect && target?.scrollBy) {
        const visibleTop = 80;
        const visibleBottom = height - CARD_ROOM;
        if (rect.y < visibleTop || rect.y + Math.min(rect.height, height * 0.4) > visibleBottom) {
          target.scrollBy(rect.y - height * 0.22);
          await wait(450);
          rect = await target.measure();
        }
      }
      if (cancelled) return;
      setMeasured({
        index: step.index,
        rect: rect && {
          x: rect.x - PADDING,
          y: rect.y - PADDING,
          width: rect.width + PADDING * 2,
          // Very tall targets are highlighted at the top so the card still fits on screen.
          height: Math.min(rect.height, height * 0.42) + PADDING * 2,
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [step, height]);

  if (!step) return null;

  const hole = measured?.index === step.index ? measured.rect : null;

  const cardWidth = Math.min(width - Spacing.three * 2, CARD_MAX_WIDTH);
  const below = !hole || height - (hole.y + hole.height) >= CARD_ROOM || hole.y < CARD_ROOM;
  const center = hole ? hole.x + hole.width / 2 : width / 2;
  const cardLeft = Math.max(
    Spacing.three,
    Math.min(center - cardWidth / 2, width - cardWidth - Spacing.three),
  );
  const arrowLeft = Math.max(RADIUS, Math.min(center - cardLeft - 8, cardWidth - RADIUS - 16));
  const cardPosition = !hole
    ? { top: height / 2 - 110 }
    : below
      ? { top: hole.y + hole.height + GAP }
      : { bottom: height - hole.y + GAP };
  const last = step.index === step.count - 1;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path
          d={hole ? spotlightPath(width, height, hole) : `M0 0H${width}V${height}H0Z`}
          fill="#140E0A"
          fillOpacity={0.66}
          fillRule="evenodd"
        />
      </Svg>
      {/* Taps on the dimmed area do nothing, so the screen underneath can't be used mid-tour. */}
      <Pressable style={StyleSheet.absoluteFill} accessibilityElementsHidden />
      {hole && (
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            { left: hole.x, top: hole.y, width: hole.width, height: hole.height },
          ]}
        />
      )}

      <View
        style={[
          styles.card,
          { width: cardWidth, left: cardLeft, backgroundColor: theme.backgroundElement },
          cardPosition,
        ]}>
        {hole && (
          <View
            style={[
              styles.arrow,
              below ? styles.arrowUp : styles.arrowDown,
              { left: arrowLeft, backgroundColor: theme.backgroundElement },
            ]}
          />
        )}
        <ThemedText type="smallBold" themeColor="accent">
          {step.index + 1} of {step.count}
        </ThemedText>
        <ThemedText type="heading">{step.data.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {step.data.body}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable onPress={tour.stop} accessibilityRole="button" hitSlop={8}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Skip tour
            </ThemedText>
          </Pressable>
          <View style={styles.flex} />
          {step.index > 0 && (
            <Pressable
              onPress={tour.back}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">Back</ThemedText>
            </Pressable>
          )}
          <Pressable
            onPress={tour.next}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>
              {last ? 'Done' : 'Next'}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  ring: {
    position: 'absolute',
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  card: {
    position: 'absolute',
    borderRadius: 24,
    padding: Spacing.three + Spacing.one,
    gap: Spacing.two,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
  },
  arrow: {
    position: 'absolute',
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
  },
  arrowUp: {
    top: -7,
  },
  arrowDown: {
    bottom: -7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  button: {
    height: 40,
    paddingHorizontal: Spacing.three + Spacing.one,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
