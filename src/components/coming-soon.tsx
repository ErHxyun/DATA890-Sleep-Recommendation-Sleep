import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/** Placeholder for tabs whose design is still to come; lists what the screen will hold. */
export function ComingSoon({ planned }: { planned: string[] }) {
  return (
    <Card>
      <ThemedText type="smallBold" themeColor="textSecondary">
        PLANNED FOR THIS SCREEN
      </ThemedText>
      <View style={styles.list}>
        {planned.map((item) => (
          <ThemedText key={item} type="small">
            • {item}
          </ThemedText>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
});
