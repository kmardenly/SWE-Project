import { Dimensions, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;

const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

export default function PostScreen() {
  return (
    <ImageBackground
      source={require('@/assets/images/post_background.png')}
      resizeMode="cover"
      style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Post</Text>
        <Text style={styles.subtitle}>Create a new post here.</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginTop: 52,
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive(24, 16, 32),
  },
  title: {
    fontSize: responsive(28, 22, 34),
    fontWeight: '700',
    color: '#111827',
    marginBottom: responsive(8, 6, 12),
  },
  subtitle: {
    fontSize: responsive(16, 14, 20),
    color: '#6B7280',
    textAlign: 'center',
  },
});
