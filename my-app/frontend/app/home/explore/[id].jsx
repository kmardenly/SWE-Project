import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

import {
  createPostComment,
  deletePostById,
  fetchExploreItemById,
  getPostComments,
  getPostSaveSummary,
  getPostLikeSummary,
  setPostSaved,
  setPostLike,
} from '@/constants/exploreItems';

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
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const fromUserId = Array.isArray(params.fromUserId) ? params.fromUserId[0] : params.fromUserId;
  const fromRoute = Array.isArray(params.fromRoute) ? params.fromRoute[0] : params.fromRoute;
  const returnY = Array.isArray(params.returnY) ? params.returnY[0] : params.returnY;
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [saveBusy, setSaveBusy] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentBusy, setCommentBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deletingPost, setDeletingPost] = useState(false);

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
        const [likeSummary, commentRows, savedState] = await Promise.all([
          getPostLikeSummary(next.id, user?.id),
          getPostComments(next.id),
          getPostSaveSummary(next.id, user?.id),
        ]);
        if (!active) return;
        setItem(next);
        setLiked(likeSummary.likedByCurrentUser);
        setLikeCount(likeSummary.likeCount);
        setComments(commentRows);
        setSaved(Boolean(savedState.savedByCurrentUser));
        setSaveCount(Number(savedState.saveCount || 0));
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
  }, [id, user?.id]);

  async function handleToggleLike() {
    if (!item?.id) return;
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to like posts.');
      return;
    }
    if (likeBusy) return;

    const nextLiked = !liked;
    const previousLiked = liked;

    setLikeBusy(true);
    setLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      await setPostLike(item.id, user.id, nextLiked);
    } catch (error) {
      setLiked(previousLiked);
      setLikeCount((prev) => Math.max(0, prev + (previousLiked ? 1 : -1)));
      Alert.alert('Error', error?.message || 'Could not update like.');
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleSubmitComment() {
    if (!item?.id) return;
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to comment.');
      return;
    }

    const trimmed = comment.trim();
    if (!trimmed) return;
    if (commentBusy) return;

    setCommentBusy(true);
    try {
      const created = await createPostComment(item.id, user.id, trimmed);
      setComments((prev) => [...prev, created]);
      setComment('');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not post comment.');
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleToggleSave() {
    if (!item?.id) return;
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to save posts.');
      return;
    }
    if (saveBusy) return;

    const nextSaved = !saved;
    const previous = saved;

    setSaveBusy(true);
    setSaved(nextSaved);
    setSaveCount((prev) => Math.max(0, prev + (nextSaved ? 1 : -1)));
    try {
      await setPostSaved(item.id, user.id, nextSaved);
    } catch (error) {
      setSaved(previous);
      setSaveCount((prev) => Math.max(0, prev + (nextSaved ? -1 : 1)));
      Alert.alert('Error', error?.message || 'Could not update save.');
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleDeletePost() {
    if (!item?.id || !user?.id || deletingPost) return;
    Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingPost(true);
            await deletePostById(item.id, user.id);
            handleBackPress();
          } catch (error) {
            Alert.alert('Error', error?.message || 'Could not delete this post.');
          } finally {
            setDeletingPost(false);
          }
        },
      },
    ]);
  }

  function handleOpenPostMenu() {
    if (!isOwnPost) return;
    Alert.alert('Post options', 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: deletingPost ? 'Deleting...' : 'Delete post',
        style: 'destructive',
        onPress: handleDeletePost,
      },
    ]);
  }

  if (loading || !item) return null;

  const photoWidth = SCREEN_WIDTH - H_PAD * 2;
  const photoHeight = photoWidth * 0.92;

  // Pull these from your item data — add fallbacks for now
  const craftType = item.craftType ?? 'craft type';
  const poster = item.creatorUsername ? `@${item.creatorUsername}` : item.poster ?? '@poster';
  const title     = item.title     ?? 'title here';
  const caption   = item.caption   ?? '';
  const tags      = Array.isArray(item.tags) && item.tags.length ? item.tags : ['tag1', 'tag2', 'etc. tags'];
  const postDate = item.createdAt ? new Date(item.createdAt) : null;
  const postDateText =
    postDate && !Number.isNaN(postDate.getTime())
      ? `${String(postDate.getMonth() + 1).padStart(2, '0')}.${String(postDate.getDate()).padStart(2, '0')}.${String(
          postDate.getFullYear()
        ).slice(-2)}`
      : '';
  const isOwnPost = !!user?.id && item.creatorId === user.id;
  const handleBackPress = () => {
    if (fromRoute === 'home') {
      router.replace({
        pathname: '/home',
        params: { restoreY: returnY || '0' },
      });
      return;
    }
    if (fromRoute === 'explore') {
      router.replace('/home/explore');
      return;
    }
    if (fromRoute === 'saves') {
      router.replace({
        pathname: '/home/saves',
        params: { fromRoute: 'profile' },
      });
      return;
    }
    if (fromRoute === 'profile') {
      router.replace('/home/profile');
      return;
    }
    if (fromUserId) {
      router.replace({
        pathname: '/home/other.profile',
        params: { userId: fromUserId },
      });
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
      <View style={styles.foreground} pointerEvents="box-none">
          <View style={styles.fill}>

            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable
                onPress={handleBackPress}
                style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                hitSlop={12}>
                <Ionicons name="chevron-back" size={responsive(28, 24, 32)} color={DARK} />
              </Pressable>
              <View style={styles.topBarSpacer} />
              {isOwnPost ? (
                <Pressable
                  onPress={handleOpenPostMenu}
                  style={({ pressed }) => [styles.moreBtn, pressed && styles.backBtnPressed]}
                  hitSlop={12}
                  disabled={deletingPost}
                >
                  <Ionicons name="ellipsis-horizontal" size={responsive(24, 20, 30)} color={DARK} />
                </Pressable>
              ) : (
                <View style={styles.topBarSpacer} />
              )}
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}>

              {/* Post header: @poster + title (craft type shown as caption below photo) */}
              <View style={[styles.postHeader, { width: photoWidth }]}>
                <Pressable
                  onPress={() => {
                    if (!item.creatorId) return;
                    if (item.creatorId === user?.id) {
                      router.push('/home/profile');
                      return;
                    }
                    router.push({
                      pathname: '/home/other.profile',
                      params: { userId: item.creatorId },
                    });
                  }}
                >
                  <Text style={styles.posterText}>{poster}</Text>
                </Pressable>
                {postDateText ? <Text style={styles.postDateText}>{postDateText}</Text> : null}
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
              <View style={[styles.actionBar, { width: photoWidth - 12 }]}>
                <View style={styles.likeSection}>
                  <Pressable onPress={handleToggleLike} hitSlop={10}>
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={responsive(28, 24, 34)}
                      color={liked ? '#e84855' : DARK}
                    />
                  </Pressable>
                  <Text style={styles.likeCountText}>{likeCount}</Text>
                </View>
                <View style={styles.likeSection}>
                  <Pressable onPress={handleToggleSave} hitSlop={10}>
                    <Ionicons
                      name={saved ? 'bookmark' : 'bookmark-outline'}
                      size={responsive(26, 22, 32)}
                      color={saved ? DARK : '#5c4a3d'}
                    />
                  </Pressable>
                  <Text style={styles.likeCountText}>{saveCount}</Text>
                </View>
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

                <View style={styles.commentComposer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="add a comment..."
                    placeholderTextColor="#9a8080"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    scrollEnabled={false}
                  />
                  <Pressable
                    style={[styles.sendCommentButton, commentBusy && styles.sendCommentButtonDisabled]}
                    onPress={handleSubmitComment}
                    disabled={commentBusy}
                  >
                    <Text style={styles.sendCommentButtonText}>{commentBusy ? '...' : 'Post'}</Text>
                  </Pressable>
                </View>

                <View style={styles.commentsList}>
                  {comments.length === 0 ? (
                    <Text style={styles.noCommentsText}>No comments yet.</Text>
                  ) : (
                    comments.map((entry) => {
                      const label = entry.username
                        ? `@${entry.username}`
                        : entry.displayName || 'Crafter';
                      return (
                        <View key={entry.id} style={styles.commentRow}>
                          <Text style={styles.commentAuthor}>{label}</Text>
                          <Text style={styles.commentContent}>{entry.content}</Text>
                        </View>
                      );
                    })
                  )}
                </View>

                <View style={styles.rule} />
              </View>

            </ScrollView>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
  },
  topBarSpacer: {
    width: 40,
    height: 40,
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
  moreBtn: {
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
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
    width: '100%',
  },
  postDateText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 17),
    color: '#8f7474',
    marginLeft: 'auto',
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
    justifyContent: 'flex-start',
    gap: 18,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: GINGHAM_CREAM,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: GINGHAM_YELLOW,
    borderRadius: 8,
  },
  likeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeCountText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 15, 21),
    color: DARK,
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
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(15, 13, 18),
    color: DARK,
    minHeight: responsive(44, 40, 52),
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sendCommentButton: {
    backgroundColor: '#e8d5d5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendCommentButtonDisabled: {
    opacity: 0.6,
  },
  sendCommentButtonText: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(15, 13, 18),
  },
  commentsList: {
    marginTop: 10,
    gap: 10,
  },
  noCommentsText: {
    fontFamily: 'Gaegu-Bold',
    color: '#8d6f6f',
    fontSize: responsive(14, 12, 16),
  },
  commentRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(92, 61, 61, 0.2)',
    paddingBottom: 8,
  },
  commentAuthor: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(14, 12, 16),
  },
  commentContent: {
    marginTop: 2,
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(14, 12, 16),
    opacity: 0.95,
  },
});