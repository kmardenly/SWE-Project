import { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@/context/UserContext';
import { fetchSavedPostsByUserId } from '@/constants/exploreItems';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';
const H_PAD = responsive(16, 12, 24);
const COLUMN_GAP = responsive(8, 6, 12);
const COL_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COLUMN_GAP) / 2;

export default function SavesScreen() {
  const params = useLocalSearchParams();
  const fromRoute = Array.isArray(params.fromRoute) ? params.fromRoute[0] : params.fromRoute;
  const { user } = useUser();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadSavedPosts = useCallback(async () => {
    if (!user?.id) {
      setSavedPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchSavedPostsByUserId(user.id);
      setSavedPosts(rows);
    } catch (error) {
      setLoadError(error?.message || 'Unable to load your saved posts.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSavedPosts();
    }, [loadSavedPosts])
  );

  const handleBackPress = () => {
    if (fromRoute === 'profile') {
      router.replace('/home/profile');
      return;
    }
    router.back();
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />
      <View style={styles.foreground}>
        <View style={styles.topBar}>
          <Pressable onPress={handleBackPress} style={styles.backButton} hitSlop={10}>
            <Ionicons name="chevron-back" size={responsive(24, 20, 28)} color={DARK} />
          </Pressable>
          <Text style={styles.title}>My Saves</Text>
          <View style={styles.topBarSpacer} />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>Loading saves...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>{loadError}</Text>
          </View>
        ) : savedPosts.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>No saved posts yet.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {savedPosts.map((post) => (
              <Pressable
                key={post.id}
                style={styles.postTile}
                onPress={() =>
                  router.push({
                    pathname: '/home/explore/[id]',
                    params: {
                      id: post.id,
                      fromRoute: 'saves',
                    },
                  })
                }
              >
                {post.imageUrl ? (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.placeholderText}>placeholder</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2e4e4',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  foreground: {
    flex: 1,
    paddingTop: responsive(56, 48, 70),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 36,
  },
  title: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(34, 28, 40),
    color: DARK,
  },
  scroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: COLUMN_GAP,
    paddingHorizontal: H_PAD,
    paddingBottom: responsive(36, 28, 48),
  },
  postTile: {
    width: COL_WIDTH,
    height: COL_WIDTH * 0.85,
    borderRadius: responsive(12, 10, 14),
    backgroundColor: '#dcd0d0',
    borderWidth: 1,
    borderColor: '#bda9a9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(14, 12, 16),
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(20, 16, 24),
    textAlign: 'center',
  },
});
