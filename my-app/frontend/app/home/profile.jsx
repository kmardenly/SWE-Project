import React, { useEffect, useState } from 'react';

// IMPORTANT: this is the code snippet we need to route to the other.profile.jsx, put it anywhere that you would click
// to reach someone's profile
//               onPress={() =>
//                   router.push({
//                     pathname: '/home/other.profile',
//                     params: { userId: item.user_id },
//                   })
//               }
// right now, i have it in renderFollowersItem and renderFollowingItem but it should prob also be implemented into search
// bar/search results functionality
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
import { useUser } from '@/context/UserContext';
import {
  getFollowersCount,
  getFollowingCount,
  getFollowersList,
  getFollowingList,
  unfollowUser,
  removeFollower,
  getDisplayName,
} from '../../FE-services/follows.service';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const currentUserId = user?.id;

  const displayName =
      user?.user_metadata?.display_name || user?.email || 'Crafter';

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);

  async function loadCounts() {
    if (!currentUserId) return;

    const [followersTotal, followingTotal] = await Promise.all([
      getFollowersCount(currentUserId),
      getFollowingCount(currentUserId),
    ]);

    setFollowersCount(followersTotal);
    setFollowingCount(followingTotal);
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

  async function loadProfileData() {
    if (!currentUserId) return;

    try {
      setLoading(true);
      await loadCounts();
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Could not load profile data.');
    } finally {
      setLoading(false);
    }
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

      setFollowing((prev) =>
          prev.filter((item) => item.user_id !== targetUserId)
      );
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

      setFollowers((prev) =>
          prev.filter((item) => item.user_id !== followerUserId)
      );
      setFollowersCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error removing follower:', error);
      Alert.alert('Error', 'Could not remove follower.');
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, [currentUserId]);

  function renderFollowersItem({ item }) {
    const isBusy = actionLoadingId === item.user_id;

    return (
        <View style={styles.listItem}>
          <Pressable
              style={styles.listTextContainer}
              onPress={() => goToOtherProfile(item.user_id)}
          >
            <Text style={styles.listName}>{getDisplayName(item)}</Text>
            {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
          </Pressable>

          <Pressable
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemoveFollower(item.user_id)}
              disabled={isBusy}
          >
            <Text style={styles.actionButtonText}>
              {isBusy ? '...' : 'Remove follower'}
            </Text>
          </Pressable>
        </View>
    );
  }

  function renderFollowingItem({ item }) {
    const isBusy = actionLoadingId === item.user_id;

    return (
        <View style={styles.listItem}>
          <Pressable
              style={styles.listTextContainer}
              onPress={() => goToOtherProfile(item.user_id)}
          >
            <Text style={styles.listName}>{getDisplayName(item)}</Text>
            {!!item.bio && <Text style={styles.listBio}>{item.bio}</Text>}
          </Pressable>

          <Pressable
              style={[styles.actionButton, styles.unfollowButton]}
              onPress={() => handleUnfollow(item.user_id)}
              disabled={isBusy}
          >
            <Text style={styles.actionButtonText}>
              {isBusy ? '...' : 'Unfollow'}
            </Text>
          </Pressable>
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

  return (
      <View style={styles.container}>
        <Image
            source={require('@/assets/images/default_user.jpg')}
            style={styles.avatar}
        />

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>This is your profile page.</Text>

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
                    <Text style={styles.emptyText}>
                      You are not following anyone yet.
                    </Text>
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
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
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
  actionButton: {
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