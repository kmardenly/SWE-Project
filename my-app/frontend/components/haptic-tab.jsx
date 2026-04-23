import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';

/**
 * Tab bar buttons must render `children` explicitly. A self-closing pressable
 * (or some PlatformPressable setups) can drop children on web/Android and look
 * like the tab icons “disappear” when pressed.
 */
export function HapticTab({ children, onPressIn, ...rest }) {
  const { style, ...pressableProps } = rest;

  return (
    <Pressable
      {...pressableProps}
      style={(state) => {
        const baseStyle = typeof style === 'function' ? style(state) : style;
        return [baseStyle, state.pressed && styles.pressed];
      }}
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

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
