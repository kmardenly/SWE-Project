import { useEffect, useState } from 'react';
import { Alert, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/context/UserContext';
import {
  getPostComments,
  getPostLikeSummary,
  getPostSaveSummary,
  setPostLike,
  setPostSaved,
} from '@/constants/exploreItems';

export default function PostCard({ post, returnScrollY = 0 }) {
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const openUserProfile = (targetUserId) => {
    if (!targetUserId) return;
    router.push({
      pathname: '/home/other.profile',
      params: { userId: targetUserId },
    });
  };

  const username = post?.creatorUsername ? `@${post.creatorUsername}` : post?.username || '@posting_user';
  const title = post?.title || 'Untitled craft';
  const caption = post?.caption || '';
  const tags = Array.isArray(post?.tags) ? post.tags.filter(Boolean) : [];
  const imageUri = post?.imageUrl || post?.imageUri || null;

  useEffect(() => {
    let active = true;
    async function loadCardStats() {
      if (!post?.id) return;
      try {
        const [likeSummary, comments, savedState] = await Promise.all([
          getPostLikeSummary(post.id, user?.id),
          getPostComments(post.id),
          getPostSaveSummary(post.id, user?.id),
        ]);
        if (!active) return;
        setLiked(Boolean(likeSummary?.likedByCurrentUser));
        setLikeCount(Number(likeSummary?.likeCount || 0));
        setCommentCount(Array.isArray(comments) ? comments.length : 0);
        setSaved(Boolean(savedState?.savedByCurrentUser));
        setSaveCount(Number(savedState?.saveCount || 0));
      } catch {
        if (!active) return;
        setLiked(false);
        setSaved(false);
      }
    }
    loadCardStats();
    return () => {
      active = false;
    };
  }, [post?.id, user?.id]);

  const openPost = () => {
    if (!post?.id) return;
    router.push({
      pathname: '/home/explore/[id]',
      params: { id: post.id, fromRoute: 'home', returnY: String(Math.max(0, returnScrollY)) },
    });
  };

  async function handleToggleLike() {
    if (!post?.id) return;
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to like posts.');
      return;
    }
    if (likeBusy) return;
    const nextLiked = !liked;
    setLikeBusy(true);
    setLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    try {
      await setPostLike(post.id, user.id, nextLiked);
    } catch (error) {
      setLiked(!nextLiked);
      setLikeCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
      Alert.alert('Error', error?.message || 'Could not update like.');
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleToggleSave() {
    if (!post?.id) return;
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to save posts.');
      return;
    }
    if (saveBusy) return;
    const nextSaved = !saved;
    setSaveBusy(true);
    setSaved(nextSaved);
    setSaveCount((prev) => Math.max(0, prev + (nextSaved ? 1 : -1)));
    try {
      await setPostSaved(post.id, user.id, nextSaved);
    } catch (error) {
      setSaved(!nextSaved);
      setSaveCount((prev) => Math.max(0, prev + (nextSaved ? -1 : 1)));
      Alert.alert('Error', error?.message || 'Could not update save.');
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <Pressable onPress={openPost} style={styles.card}>
      <View style={styles.postHeader}>
        <View style={styles.avatarCircle}>
          {post?.creatorAvatarUrl || post?.userAvatar ? (
            <Image source={{ uri: post?.creatorAvatarUrl || post?.userAvatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={26} color="#6f5d5d" />
          )}
        </View>
        <Pressable onPress={(e) => { e.stopPropagation(); openUserProfile(post?.creatorId || post?.userId); }}>
          <Text style={styles.postUsername}>{username}</Text>
        </Pressable>
      </View>

      <Text style={styles.postTitle}>{title}</Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.postImage} resizeMode="cover" />
      ) : (
        <View style={styles.postImagePlaceholder}>
          <Ionicons name="image-outline" size={42} color="#817171" />
        </View>
      )}

      <View style={styles.actionRow}>
        <View style={styles.leftActionWrap}>
          <Pressable onPress={(e) => { e.stopPropagation(); handleToggleLike(); }} hitSlop={8}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={23} color={liked ? '#e84855' : '#875757'} />
          </Pressable>
          <Text style={styles.likeCount}>{likeCount}</Text>
        </View>
        <View style={styles.commentAction}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b5a5a" />
          <Text style={styles.commentCount}>{commentCount}</Text>
        </View>
        <View style={styles.commentAction}>
          <Pressable onPress={(e) => { e.stopPropagation(); handleToggleSave(); }} hitSlop={8}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color="#5b4a4a" />
          </Pressable>
          <Text style={styles.commentCount}>{saveCount}</Text>
        </View>
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}

      <View style={styles.tagsRow}>
        {tags.map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#efd8dd',
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#b89fa3',
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#dbc7cb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  postUsername: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: '#3f3232',
  },
  postTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 24,
    color: '#352929',
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 280,
    borderRadius: 10,
  },
  postImagePlaceholder: {
    width: '100%',
    height: 280,
    borderRadius: 10,
    backgroundColor: '#2f2f3f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bdb2a8',
    backgroundColor: '#efe9d8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
  },
  leftActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 24,
    color: '#3f3232',
  },
  commentCount: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: '#3f3232',
  },
  caption: {
    marginTop: 8,
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: '#3f3232',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: '#fff2f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: '#3f3232',
  },
});