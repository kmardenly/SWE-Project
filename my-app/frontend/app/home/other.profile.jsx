import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter} from 'expo-router';
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
} from '../../FE-services/follows.service';

export default function OtherProfileScreen() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const router = useRouter();

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

  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);

  const isOwnProfile = currentUserId && viewedUserId && currentUserId === viewedUserId;

  async function loadScreen() {
    if (!viewedUserId) return;

    try {
      setLoading(true);

      const [profileData, followersTotal, followingTotal] = await Promise.all([
        getUserProfile(viewedUserId),
        getFollowersCount(viewedUserId),
        getFollowingCount(viewedUserId),
      ]);

      setProfile(profileData);
      setFollowersCount(followersTotal);
      setFollowingCount(followingTotal);

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

  const displayName = getDisplayName(profile);

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <Image
            source={require('@/assets/images/default_user.jpg')}
            style={styles.avatar}
        />

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>{profile?.bio || 'Crafter profile'}</Text>

        <View style={styles.statsRow}>
          <Pressable style={styles.statCard} onPress={openFollowersModal}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </Pressable>

          <Pressable style={styles.statCard} onPress={openFollowingModal}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </Pressable>
        </View>

        {!isOwnProfile && (
            <Pressable
                style={[
                  styles.followButton,
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
        )}

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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    minWidth: 120,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  followButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  followNowButton: {
    backgroundColor: '#111827',
  },
  followingButton: {
    backgroundColor: '#7C5C5C',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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