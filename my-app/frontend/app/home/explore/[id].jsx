import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { fetchExploreItemById } from '@/constants/exploreItems';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;

const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';
const GINGHAM_YELLOW = '#f5e6b8';
const GINGHAM_CREAM = '#faf3dc';
const CREAM = '#faf6f0';

const H_PAD = responsive(16, 12, 24);

export default function ExplorePhotoScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadItem() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');
      try {
        const next = await fetchExploreItemById(String(id));
        if (!active) return;
        if (!next) {
          router.back();
          return;
        }
        setItem(next);
      } catch (error) {
        if (!active) return;
        setLoadError(error?.message || 'Unable to load this post.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadItem();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading || !item) return null;

  const photoWidth = SCREEN_WIDTH - H_PAD * 2;
  const photoHeight = photoWidth * 0.92;

  // Pull these from your item data — add fallbacks for now
  const craftType = item.craftType ?? 'craft type';
  const poster    = item.poster    ?? '@poster';
  const title     = item.title     ?? 'title here';
  const caption   = item.caption   ?? '';
  const tags      = Array.isArray(item.tags) && item.tags.length ? item.tags : ['tag1', 'tag2', 'etc. tags'];

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />
      <View style={styles.foreground} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.fill}>

            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                hitSlop={12}>
                <Ionicons name="chevron-back" size={responsive(28, 24, 32)} color={DARK} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>

              {/* Post header: @poster + title (craft type shown as caption below photo) */}
              <View style={[styles.postHeader, { width: photoWidth }]}>
                <Text style={styles.posterText}>{poster}</Text>
                <Text style={styles.titleText}>{title}</Text>
              </View>

              {/* Photo */}
              <View style={[styles.photoFrame, { width: photoWidth }]}>
                {item.imageUrl && !imageFailed ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={[styles.photo, { width: photoWidth, height: photoHeight }]}
                    resizeMode="cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <View style={[styles.photo, styles.photoFallback, { width: photoWidth, height: photoHeight }]}>
                    <Text style={styles.photoFallbackText}>image unavailable</Text>
                  </View>
                )}
              </View>

              {/* Like / bookmark bar */}
              <View style={[styles.actionBar, { width: photoWidth }]}>
                <Pressable onPress={() => setLiked((v) => !v)} hitSlop={10}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={responsive(28, 24, 34)}
                    color={liked ? '#e84855' : DARK}
                  />
                </Pressable>
                <Pressable onPress={() => setSaved((v) => !v)} hitSlop={10}>
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={responsive(26, 22, 32)}
                    color={saved ? DARK : '#5c4a3d'}
                  />
                </Pressable>
              </View>

              {/* Craft caption + tags + comments */}
              <View style={[styles.textBlock, { width: photoWidth }]}>
                {loadError ? <Text style={styles.captionSecondary}>{loadError}</Text> : null}
                <Text style={styles.caption}>{craftType}</Text>
                {caption ? <Text style={styles.captionSecondary}>{caption}</Text> : null}

                {/* Tags */}
                <View style={styles.tagsRow}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>x {tag}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.rule} />

                <Text style={styles.commentsHeading}>comments</Text>

                <TextInput
                  style={styles.commentInput}
                  placeholder="add a comment..."
                  placeholderTextColor="#9a8080"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />

                <View style={styles.rule} />
              </View>

            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2e4e4' },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    width: '100%',
    height: '100%',
  },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  fill: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backBtnPressed: { opacity: 0.85 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: responsive(40, 28, 52),
    alignItems: 'center',
  },

  // Post header above photo
  postHeader: {
    marginTop: 6,
    marginBottom: 8,
  },
  posterText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 17),
    color: '#a08080',
    marginBottom: 4,
  },
  titleText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(24, 20, 30),
    lineHeight: responsive(30, 26, 36),
    color: DARK,
  },

  // Photo
  photoFrame: {
    backgroundColor: CREAM,
    borderRadius: responsive(12, 10, 14),
    overflow: 'hidden',
  },
  photo: {
    borderRadius: responsive(12, 10, 14),
    backgroundColor: '#e9ddd3',
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(16, 14, 20),
    color: '#8d6f6f',
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: GINGHAM_CREAM,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: GINGHAM_YELLOW,
    borderRadius: 8,
  },

  // Text block below action bar
  textBlock: {
    marginTop: 14,
    alignSelf: 'center',
  },
  caption: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(15, 13, 18),
    color: DARK,
    lineHeight: responsive(22, 19, 26),
    marginBottom: 8,
  },
  captionSecondary: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 17),
    color: DARK,
    lineHeight: responsive(20, 17, 24),
    opacity: 0.9,
    marginBottom: 10,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#e8d5d5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 17),
    color: DARK,
  },

  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(92, 61, 61, 0.35)',
    marginVertical: 14,
  },
  commentsHeading: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 15, 20),
    color: DARK,
    marginBottom: 8,
  },
  commentInput: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(15, 13, 18),
    color: DARK,
    minHeight: responsive(44, 40, 52),
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
});