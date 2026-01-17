// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation & tabs
  'house.fill': 'home',
  'bell.fill': 'notifications',
  'gearshape.fill': 'settings',
  'map.fill': 'map',
  
  // Actions
  'paperplane.fill': 'send',
  'chevron.right': 'chevron-right',
  'chevron.left.forwardslash.chevron.right': 'code',
  'rectangle.portrait.and.arrow.right': 'logout',
  'arrow.clockwise': 'refresh',
  'arrow.triangle.2.circlepath': 'swap-horiz',
  
  // Status & info
  'info.circle': 'info',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.circle': 'error',
  'lightbulb.fill': 'lightbulb',
  'clock.fill': 'schedule',
  'xmark.circle.fill': 'cancel',
  
  // Transport & location
  'bus': 'directions-bus',
  'car.fill': 'directions-car',
  'location.fill': 'location-on',
  'speedometer': 'speed',
  'safari': 'explore',
  'figure.run': 'directions-run',
  
  // People & communication
  'person.fill': 'person',
  'person.2.fill': 'people',
  'megaphone.fill': 'campaign',
  'hand.raised': 'pan-tool',
  'doc.text': 'description',
  
  // Misc
  'moon.zzz.fill': 'nightlight',
  'moon.fill': 'dark-mode',
  'tray.fill': 'inbox',
  'hand.wave': 'waving-hand',
  'mappin': 'place',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
