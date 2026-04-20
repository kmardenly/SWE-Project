import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import {
  getFollowersCount,
  getFollowingCount,
  getFollowersList,
  getFollowingList,
  unfollowUser,
  removeFollower,
  getUserName,
} from '@/FE-services/follows.service';
import { resolveAvatarUrl } from '@/lib/resolveAvatarUrl';
import { supabase } from '@/lib/supabaseClient';
import { fetchPostsByCreatorId } from '@/constants/exploreItems';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';
const PAGE_BG = '#fdf5f3';
const H_PAD = responsive(16, 12, 24);
const COLUMN_GAP = responsive(12, 8, 16);
const COL_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COLUMN_GAP) / 2;

function formatStat(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  return n >= 1000 ? n.toLocaleString() : String(n);
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);

  const userName = getUserName(profile);

  const loadProfileRow = useCallback(async () => {
    if (!user?.id || !supabase) return;
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, username, display_name, avatar_url, bio, level')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    const avatarUrl = await resolveAvatarUrl(data?.avatar_url || '');
    setProfile({
      ...(data || {}),
      avatar_url: avatarUrl,
    });
  }, [user?.id]);

  async function loadCounts() {
    if (!currentUserId) return;
    const [followersTotal, followingTotal] = await Promise.all([
      getFollowersCount(currentUserId),
      getFollowingCount(currentUserId),
    ]);
    setFollowersCount(followersTotal);
    setFollowingCount(followingTotal);
  }

  async function loadPosts() {
    if (!currentUserId) return;
    try {
      const posts = await fetchPostsByCreatorId(currentUserId);
      setUserPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  const refreshAll = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await Promise.all([loadProfileRow(), loadCounts(), loadPosts()]);
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Could not load profile data.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loadProfileRow]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  function goToOtherProfile(targetUserId) {
    if (!targetUserId) return;
    setFollowersModalVisible(false);
    setFollowingModalVisible(false);
    setTimeout(() => {
      router.push({
        pathname: '/home/other.profile',
        params: { userId: targetUserId },
      });
    }, 150);
  }

  async function openFollowersModal() {
    if (!currentUserId) return;
    try {
      const data = await getFollowersList(currentUserId);
      setFollowers(data);
      setFollowersModalVisible(true);
    } catch (error) {
      console.error('Error loading followers:', error);
      Alert.alert('Error', 'Could not load followers.');
    }
  }

  async function openFollowingModal() {
    if (!currentUserId) return;
    try {
      const data = await getFollowingList(currentUserId);
      setFollowing(data);
      setFollowingModalVisible(true);
    } catch (error) {
      console.error('Error loading following:', error);
      Alert.alert('Error', 'Could not load following.');
    }
  }

  async function handleUnfollow(targetUserId) {
    try {
      setActionLoadingId(targetUserId);
      await unfollowUser(currentUserId, targetUserId);
      setFollowing((prev) => prev.filter((item) => item.user_id !== targetUserId));
      setFollowingCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', 'Could not unfollow user.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRemoveFollower(followerUserId) {
    try {
      setActionLoadingId(followerUserId);
      await removeFollower(currentUserId, followerUserId);
      setFollowers((prev) => prev.filter((item) => item.user_id !== followerUserId));
      setFollowersCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error removing follower:', error);
      Alert.alert('Error', 'Could not remove follower.');
    } finally {
      setActionLoadingId(null);
    }
  }

  function renderFollowersItem({ item }) {
    const isBusy = actionLoadingId === item.user_id;
    return (
      <View style={styles.listItem}>
        <Pressable style={styles.listTextContainer} onPress={() => goToOtherProfile(item.user_id)}>
          <Text style={styles.listName}>{getUserName(item)}</Text>
          {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
        </Pressable>
        <Pressable
          style={[styles.modalActionButton, styles.removeButton]}
          onPress={() => handleRemoveFollower(item.user_id)}
          disabled={isBusy}
        >
          <Text style={styles.modalActionButtonText}>{isBusy ? '...' : 'Remove follower'}</Text>
        </Pressable>
      </View>
    );
  }

  function renderFollowingItem({ item }) {
    const isBusy = actionLoadingId === item.user_id;
    return (
      <View style={styles.listItem}>
        <Pressable style={styles.listTextContainer} onPress={() => goToOtherProfile(item.user_id)}>
          <Text style={styles.listName}>{getUserName(item)}</Text>
          {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
        </Pressable>
        <Pressable
          style={[styles.modalActionButton, styles.unfollowButton]}
          onPress={() => handleUnfollow(item.user_id)}
          disabled={isBusy}
        >
          <Text style={styles.modalActionButtonText}>{isBusy ? '...' : 'Unfollow'}</Text>
        </Pressable>
      </View>
    );
  }

  const postsCount = userPosts.length;
  const bioText =
    profile?.bio?.trim() || 'Hello, I am username and I love making crafts';

  if (loading && !profile) {
    return (
      <View style={styles.root}>
        <ImageBackground
          source={require('@/assets/images/goal_bg.png')}
          resizeMode="cover"
          style={styles.backgroundLayer}
        />
        <View style={[styles.loadingContainer, styles.foreground]}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('@/assets/images/goal_bg.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />
      <View style={styles.foreground}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            style={({ pressed }) => [styles.headerBack, pressed && styles.headerBackPressed]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={responsive(24, 20, 28)} color={DARK} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.profileHeaderRow}>
          <Image
            source={
              profile?.avatar_url
                ? { uri: profile.avatar_url }
                : require('@/assets/images/default_user.jpg')
            }
            style={styles.avatar}
          />
          <View style={styles.headerRight}>
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Posts</Text>
                <Text style={styles.statNumber}>{formatStat(postsCount)}</Text>
              </View>
              <Pressable style={styles.statCell} onPress={openFollowersModal}>
                <Text style={styles.statLabel}>Followers</Text>
                <Text style={styles.statNumber}>{formatStat(followersCount)}</Text>
              </Pressable>
              <Pressable style={styles.statCell} onPress={openFollowingModal}>
                <Text style={styles.statLabel}>Following</Text>
                <Text style={styles.statNumber}>{formatStat(followingCount)}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.bio}>{bioText}</Text>

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.pillButton, pressed && styles.pillButtonPressed]}
            onPress={() => router.push('/home/edit-profile')}
          >
            <Text style={styles.pillButtonText}>Edit Profile</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.pillButton, pressed && styles.pillButtonPressed]}
            onPress={() =>
              router.push({
                pathname: '/home/saves',
                params: { fromRoute: 'profile' },
              })
            }
          >
            <Text style={styles.pillButtonText}>Saved</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <Pressable
                key={post.id}
                style={styles.postTile}
                onPress={() =>
                  router.push({
                    pathname: '/home/explore/[id]',
                    params: { id: post.id, fromRoute: 'profile' },
                  })
                }
              >
                {post.imageUrl ? (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
                ) : (
                  <View style={styles.postPlaceholder}>
                    <Text style={styles.postPlaceholderText}>placeholder</Text>
                  </View>
                )}
              </Pressable>
            ))
          ) : (
            <Text style={styles.noPostsText}>No posts yet.</Text>
          )}
        </View>
        </ScrollView>
      </View>

      <Modal
        visible={followersModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFollowersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Followers</Text>
            <FlatList
              data={followers}
              keyExtractor={(item) => item.user_id}
              renderItem={renderFollowersItem}
              ListEmptyComponent={<Text style={styles.emptyText}>No followers yet.</Text>}
            />
            <Pressable style={styles.closeButton} onPress={() => setFollowersModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={followingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFollowingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Following</Text>
            <FlatList
              data={following}
              keyExtractor={(item) => item.user_id}
              renderItem={renderFollowingItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>You are not following anyone yet.</Text>
              }
            />
            <Pressable style={styles.closeButton} onPress={() => setFollowingModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerBackPressed: {
    opacity: 0.88,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: responsive(40, 28, 52),
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 14,
  },
  avatar: {
    width: responsive(100, 88, 112),
    height: responsive(100, 88, 112),
    borderRadius: responsive(50, 44, 56),
    backgroundColor: '#e8e0dc',
  },
  headerRight: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(26, 22, 30),
    color: DARK,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7a6560',
    fontWeight: '600',
    marginBottom: 2,
  },
  statNumber: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 16, 22),
    color: DARK,
  },
  bio: {
    fontSize: 15,
    color: '#4b3f3c',
    lineHeight: 22,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  pillButton: {
    flex: 1,
    backgroundColor: '#f5d0d0',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c3d3d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pillButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  pillButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 15, 20),
    color: DARK,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  postTile: {
    width: COL_WIDTH,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ede4e2',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postPlaceholderText: {
    fontSize: 13,
    color: '#8a7874',
  },
  noPostsText: {
    width: '100%',
    textAlign: 'center',
    color: '#8a7874',
    fontSize: 15,
    paddingVertical: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '75%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listTextContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listBio: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  modalActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  unfollowButton: {
    backgroundColor: '#7C5C5C',
  },
  removeButton: {
    backgroundColor: '#9A3412',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    paddingVertical: 30,
  },
});
