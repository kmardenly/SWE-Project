import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

/**
 * Tab bar buttons must render `children` explicitly. A self-closing pressable
 * (or some PlatformPressable setups) can drop children on web/Android and look
 * like the tab icons “disappear” when pressed.
 */
export function HapticTab({ children, onPressIn, ...rest }) {
  return (
    <Pressable
      {...rest}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}>
      {children}
    </Pressable>
  );
}
