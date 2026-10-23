import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function CoachScreen() {
  return (
    <Screen title="Coach">
      <ComingSoon
        planned={[
          'Current behavioral goal and progress, e.g. a consistent wake time',
          'Recommendation history with feedback',
          'Ask the coach: LLM explanations grounded in the recommendation rules',
          'Safety prompts that suggest seeing a PCP or seeking urgent care',
        ]}
      />
    </Screen>
  );
}
