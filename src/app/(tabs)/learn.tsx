import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function LearnScreen() {
  return (
    <Screen title="Learn">
      <ComingSoon
        planned={[
          'Short psychoeducation lessons: sleep drive, circadian rhythm, CBT-I basics',
          'What wearable numbers mean, and their limits',
          'Content reviewed by clinicians, with references',
        ]}
      />
    </Screen>
  );
}
