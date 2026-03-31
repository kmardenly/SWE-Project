import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, View, StyleSheet } from 'react-native';

export default function CatWindow({ mood = 'happy' }) {
  const bounce = useRef(new Animated.Value(0)).current;
  const CAT_IMAGES = {
    happy:   require('../assets/images/cat-happy.png'),
    sad:     require('../assets/images/cat-sad.png'),
    playful: require('../assets/images/cat-playful.png'),
    default: require('../assets/images/cat-default.png'),
  };

  useEffect(() => {
    bounce.stopAnimation();

    if (mood === 'happy') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -6, duration: 700, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else if (mood === 'sad') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: 4, duration: 1200, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else if (mood === 'playful') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -14, duration: 300, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mood]);

  const handleTap = () => {
    Animated.sequence([
      Animated.timing(bounce, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={handleTap} style={styles.wrapper}>
      <View style={styles.window}>

        {/* ── Layer 1: background── */}
        <Image
          source={require('../assets/images/window-bg.png')}  // 🔁 replace with your bg
          style={styles.layer}
          resizeMode="cover"
        />

        {/* ── Layer 2: middle── */}
        <Image
          source={require('../assets/images/window-mid.png')} // 🔁 replace with your mid
          style={styles.layer}
          resizeMode="cover"
        />

        {/* ── Layer 3: cat ── */}
       <Animated.Image
        source={catImage}  
        style={[styles.layer, styles.cat, { transform: [{ translateY: bounce }] }]}
        resizeMode="contain"
      />

        {/* ── Layer 4: frame  ── */}
        <Image
          source={require('../assets/images/window-frame.png')}
          style={styles.layer}
          resizeMode="cover"
        />

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  window: {
    width: 160,
    height: 160,
    position: 'relative',

    // pixel art crisp rendering
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#555',
    borderRadius: 4,

    // drop shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 6,
  },
  layer: {
    position: 'absolute',
    width: '100%',
    height: '100%',

    // keeps pixel art sharp instead of blurry
    // @ts-ignore — RN supports this on iOS/Android
    imageRendering: 'pixelated',
  },
  cat: {
    // sit the cat towards the bottom of the window
    top: '30%',
  },
});