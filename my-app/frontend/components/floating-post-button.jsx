import { Pressable, StyleSheet, View } from 'react-native';

export default function FloatingPostButton({ bottom = 0, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shell,
        { bottom },
        pressed && styles.shellPressed,
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Create post"
    >
      <View style={styles.buttonFace}>
        <View style={[styles.hole, styles.holeTopLeft]} />
        <View style={[styles.hole, styles.holeTopRight]} />
        <View style={[styles.hole, styles.holeBottomLeft]} />
        <View style={[styles.hole, styles.holeBottomRight]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#e8d2d5',
    borderWidth: 2,
    borderColor: '#a98686',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 30,
  },
  shellPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  buttonFace: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f7ecec',
    borderWidth: 1.5,
    borderColor: '#c4a2a2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hole: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#b58f8f',
  },
  holeTopLeft: {
    top: 12,
    left: 12,
  },
  holeTopRight: {
    top: 12,
    right: 12,
  },
  holeBottomLeft: {
    bottom: 12,
    left: 12,
  },
  holeBottomRight: {
    bottom: 12,
    right: 12,
  },
});
