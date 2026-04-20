import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import {
  getFollowersCount,
  getFollowingCount,
  getFollowersList,
  getFollowingList,
  isFollowing,
  followUser,
  unfollowUser,
  getUserProfile,
  getDisplayName,
  getUserName,
} from '../../FE-services/follows.service';
import { fetchPostsByCreatorId } from '@/constants/exploreItems';
import { getOrCreateDirectMessageChat } from '@/lib/groupChats.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const H_PAD = responsive(16, 12, 24);
const COLUMN_GAP = responsive(12, 8, 16);
const COL_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COLUMN_GAP) / 2;
const DARK = '#5c3d3d';

export default function OtherProfileScreen() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();
  const viewedUserId = Array.isArray(params.userId)
      ? params.userId[0]
      : params.userId;

  const [loading, setLoading] = useState(true);
  const [followButtonLoading, setFollowButtonLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [profile, setProfile] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentlyFollowing, setCurrentlyFollowing] = useState(false);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [userPosts, setUserPosts] = useState([]);

  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);

  const isOwnProfile = currentUserId && viewedUserId && currentUserId === viewedUserId;

  const userName = getUserName(profile);
  const displayName = getDisplayName(profile);

  async function loadScreen() {
    if (!viewedUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [profileData, followersTotal, followingTotal, posts] = await Promise.all([
        getUserProfile(viewedUserId),
        getFollowersCount(viewedUserId),
        getFollowingCount(viewedUserId),
        fetchPostsByCreatorId(viewedUserId),
      ]);

      setProfile(profileData);
      setFollowersCount(followersTotal);
      setFollowingCount(followingTotal);
      setUserPosts(posts);

      if (currentUserId && currentUserId !== viewedUserId) {
        const followState = await isFollowing(currentUserId, viewedUserId);
        setCurrentlyFollowing(followState);
      } else {
        setCurrentlyFollowing(false);
      }
    } catch (error) {
      console.error('Error loading other profile:', error);
      Alert.alert('Error', 'Could not load this profile.');
    } finally {
      setLoading(false);
    }
  }

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

  async function handleToggleFollow() {
    if (!currentUserId || !viewedUserId || isOwnProfile) return;

    try {
      setFollowButtonLoading(true);

      if (currentlyFollowing) {
        await unfollowUser(currentUserId, viewedUserId);
        setCurrentlyFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await followUser(currentUserId, viewedUserId);
        setCurrentlyFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Could not update follow status.');
    } finally {
      setFollowButtonLoading(false);
    }
  }

  async function handleStartMessage() {
    if (!currentUserId || !viewedUserId || isOwnProfile) return;

    try {
      const chatId = await getOrCreateDirectMessageChat(currentUserId, viewedUserId);
      router.push(`/home/group-chats/${chatId}`);
    } catch (error) {
      console.error('Error starting message thread:', error);
      Alert.alert('Error', error?.message || 'Could not open chat.');
    }
  }

  async function openFollowersModal() {
    if (!viewedUserId) return;

    try {
      const data = await getFollowersList(viewedUserId);
      setFollowers(data);
      setFollowersModalVisible(true);
    } catch (error) {
      console.error('Error loading followers:', error);
      Alert.alert('Error', 'Could not load followers.');
    }
  }

  async function openFollowingModal() {
    if (!viewedUserId) return;

    try {
      const data = await getFollowingList(viewedUserId);
      setFollowing(data);
      setFollowingModalVisible(true);
    } catch (error) {
      console.error('Error loading following:', error);
      Alert.alert('Error', 'Could not load following.');
    }
  }

  async function handleUnfollowFromList(targetUserId) {
    if (!currentUserId) return;

    try {
      setActionLoadingId(targetUserId);
      await unfollowUser(currentUserId, targetUserId);

      setFollowing((prev) => prev.filter((item) => item.user_id !== targetUserId));
    } catch (error) {
      console.error('Error unfollowing from list:', error);
      Alert.alert('Error', 'Could not unfollow user.');
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    loadScreen();
  }, [viewedUserId, currentUserId]);

  function renderFollowersItem({ item }) {
    const isCurrentUser = item.user_id === currentUserId;

    if (isCurrentUser) {
      return (
          <View style={styles.listItem}>
            <View style={styles.listTextContainer}>
              <Text style={styles.listName}>{getDisplayName(item)}</Text>
              {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
            </View>
          </View>
      );
    }

    return (
        <Pressable onPress={() => goToOtherProfile(item.user_id)}>
          <View style={styles.listItem}>
            <View style={styles.listTextContainer}>
              <Text style={styles.listName}>{getDisplayName(item)}</Text>
              {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
            </View>
          </View>
        </Pressable>
    );
  }

  function renderFollowingItem({ item }) {
    const isBusy = actionLoadingId === item.user_id;
    const isCurrentUser = item.user_id === currentUserId;

    return (
        <View style={styles.listItem}>
          {isCurrentUser ? (
              <View style={styles.listTextContainer}>
                <Text style={styles.listName}>{getDisplayName(item)}</Text>
                {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
              </View>
          ) : (
              <Pressable
                  style={styles.listTextContainer}
                  onPress={() => goToOtherProfile(item.user_id)}
              >
                <Text style={styles.listName}>{getDisplayName(item)}</Text>
                {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
              </Pressable>
          )}

          {!!currentUserId && currentUserId !== item.user_id && (
              <Pressable
                  style={[styles.actionButton, styles.unfollowButton]}
                  onPress={() => handleUnfollowFromList(item.user_id)}
                  disabled={isBusy}
              >
                <Text style={styles.actionButtonText}>
                  {isBusy ? '...' : 'Unfollow'}
                </Text>
              </Pressable>
          )}
        </View>
    );
  }

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
    );
  }

  if (!viewedUserId) {
    return (
      <View style={styles.missingStateContainer}>
        <Text style={styles.missingStateText}>Click on a username on a post to access other profiles</Text>
        <Pressable style={styles.missingStateButton} onPress={() => router.back()}>
          <Text style={styles.missingStateButtonText}>Go Back</Text>
        </Pressable>
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
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={responsive(24, 20, 28)} color={DARK} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileHeader}>
              <Image
                source={
                  profile?.avatar_url
                    ? { uri: profile.avatar_url }
                    : require('@/assets/images/default_user.jpg')
                }
                style={styles.avatar}
              />

              <View style={styles.profileInfo}>
                <Text style={styles.name}>{displayName || userName}</Text>
                <View style={styles.statsRow}>
                  <Pressable style={styles.statCell} onPress={openFollowersModal}>
                    <Text style={styles.statLabel}>Followers</Text>
                    <Text style={styles.statNumber}>{followersCount}</Text>
                  </Pressable>
                  <Pressable style={styles.statCell} onPress={openFollowingModal}>
                    <Text style={styles.statLabel}>Following</Text>
                    <Text style={styles.statNumber}>{followingCount}</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <Text style={styles.subtitle}>{profile?.bio || 'Hello, I am username and I love making crafts'}</Text>

            {!isOwnProfile && (
              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.profileActionButton,
                    currentlyFollowing ? styles.followingButton : styles.followNowButton,
                  ]}
                  onPress={handleToggleFollow}
                  disabled={followButtonLoading}
                >
                  <Text style={styles.followButtonText}>
                    {followButtonLoading
                      ? 'Loading...'
                      : currentlyFollowing
                        ? 'Unfollow'
                        : 'Follow'}
                  </Text>
                </Pressable>
                <Pressable style={styles.profileActionButton} onPress={handleStartMessage}>
                  <Text style={styles.followButtonText}>Message</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.grid}>
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <Pressable
                    key={post.id}
                    style={styles.postTile}
                    onPress={() =>
                      router.push({
                        pathname: '/home/explore/[id]',
                        params: {
                          id: post.id,
                          fromUserId: viewedUserId,
                        },
                      })
                    }
                  >
                    {post.imageUrl ? (
                      <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
                    ) : (
                      <Text style={styles.postPlaceholderText}>placeholder</Text>
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
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No followers yet.</Text>
                  }
              />

              <Pressable
                  style={styles.closeButton}
                  onPress={() => setFollowersModalVisible(false)}
              >
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
                    <Text style={styles.emptyText}>Not following anyone yet.</Text>
                  }
              />

              <Pressable
                  style={styles.closeButton}
                  onPress={() => setFollowingModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f2e4e4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingStateContainer: {
    flex: 1,
    backgroundColor: '#f2e4e4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  missingStateText: {
    color: DARK,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 17, 24),
    textAlign: 'center',
  },
  missingStateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  missingStateButtonText: {
    color: DARK,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(16, 14, 19),
  },
  root: {
    flex: 1,
    backgroundColor: '#f2e4e4',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topBar: {
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: responsive(48, 36, 60),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  avatar: {
    width: responsive(96, 82, 110),
    height: responsive(96, 82, 110),
    borderRadius: responsive(48, 41, 55),
    backgroundColor: '#D2D2D2',
  },
  name: {
    fontSize: responsive(38, 30, 44),
    color: DARK,
    fontFamily: 'Gaegu-Bold',
  },
  subtitle: {
    marginTop: 14,
    marginBottom: 18,
    fontSize: responsive(14, 13, 17),
    lineHeight: responsive(20, 18, 24),
    color: DARK,
    fontFamily: 'Gaegu-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 6,
  },
  statCell: {
    minWidth: 84,
  },
  statNumber: {
    fontSize: responsive(34, 28, 40),
    color: DARK,
    fontFamily: 'Gaegu-Bold',
  },
  statLabel: {
    fontSize: responsive(13, 12, 16),
    color: DARK,
    fontFamily: 'Gaegu-Bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 18,
  },
  profileActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A58E86',
    backgroundColor: '#e8d5d5',
  },
  followNowButton: {
    backgroundColor: '#E7D4D4',
  },
  followingButton: {
    backgroundColor: '#D7BFBF',
  },
  followButtonText: {
    color: DARK,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 15, 20),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: COLUMN_GAP,
    marginBottom: 20,
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
  postPlaceholderText: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(14, 12, 16),
  },
  noPostsText: {
    width: '100%',
    textAlign: 'center',
    color: DARK,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 15, 21),
    marginTop: 8,
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
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  unfollowButton: {
    backgroundColor: '#7C5C5C',
  },
  actionButtonText: {
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