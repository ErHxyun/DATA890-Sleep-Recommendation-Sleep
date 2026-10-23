import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';

type IconCircleProps = {
  icon: SymbolViewProps['name'];
  background: string;
  color: string;
  size?: number;
};

/** Round icon chip used for stages, vitals, and list rows. */
export function IconCircle({ icon, background, color, size = 44 }: IconCircleProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <SymbolView name={icon} size={size * 0.45} tintColor={color} />
    </View>
  );
}
