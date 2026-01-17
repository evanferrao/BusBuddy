import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS } from '@/constants/bus-tracker';
import Animated from 'react-native-reanimated';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <IconSymbol name="hand.wave" size={28} color={BUS_COLORS.primary} />
    </Animated.View>
  );
}
