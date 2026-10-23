import { StageColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useStageColors() {
  const scheme = useColorScheme();
  return StageColors[scheme === 'dark' ? 'dark' : 'light'];
}
