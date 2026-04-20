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
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@/context/UserContext';
import {
  getFollowersCount,
  getFollowingCount,
  getFollowersList,
  getFollowingList,
  unfollowUser,
  removeFollower,
  getDisplayName,
  getUserName,
  resolveAvatarUrl,

} from '../../FE-services/follows.service';
import { useRouter } from 'expo-router';
import {supabase} from "@/lib/supabaseClient";

const AVATAR_BUCKET_CANDIDATES = [
  process.env.EXPO_PUBLIC_SUPABASE_AVATARS_BUCKET,
  'images',
  'avatars',
].filter(Boolean);

const fileExtensionFromUri = (uri) => {
  const clean = String(uri || '').split('?')[0].split('#')[0];
  const maybeExt = clean.includes('.') ? clean.slice(clean.lastIndexOf('.') + 1).toLowerCase() : '';
  return maybeExt && maybeExt.length <= 5 ? maybeExt : 'jpg';
};

const base64ToUint8Array = (base64) => {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const imagePickerMediaTypes =
  ImagePicker?.MediaType?.Images ??
  ImagePicker?.MediaTypeOptions?.Images;

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const currentUserId = user?.id;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, username, display_name, avatar_url, bio, level')
          .eq('user_id', user.id)
          .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      console.log('profile row:', data);
      const avatarUrl = await resolveAvatarUrl(data?.avatar_url || '');
      setProfile({
        ...(data || {}),
        avatar_url: avatarUrl,
      });
      setBioDraft(data?.bio || '');
      setUsernameDraft(data?.username || '');
    };

    loadProfile();
  }, [user?.id]);

  const userName = getUserName(profile);
  const displayName = getDisplayName(profile);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);

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

  async function uploadAvatarToStorage({ uri, base64, userId }) {
    if (!uri || !userId || !supabase) {
      throw new Error('Missing avatar upload requirements.');
    }

    const ext = fileExtensionFromUri(uri);
    // Keep user id as first folder to satisfy common storage RLS policies.
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const uploadBody = base64
      ? base64ToUint8Array(base64)
      : await (async () => {
          const response = await fetch(uri);
          const blob = await response.blob();
          if (!blob || typeof blob.size !== 'number' || blob.size <= 0) {
            throw new Error('Selected image appears empty.');
          }
          return blob;
        })();

    let lastError = null;
    for (const bucket of AVATAR_BUCKET_CANDIDATES) {
      const { error } = await supabase.storage.from(bucket).upload(filePath, uploadBody, {
        cacheControl: '3600',
        upsert: false,
        contentType: base64 ? `image/${ext}` : uploadBody.type || `image/${ext}`,
      });

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (data?.publicUrl?.startsWith('http://') || data?.publicUrl?.startsWith('https://')) {
          return data.publicUrl;
        }
      } else {
        lastError = error;
      }
    }

    throw lastError || new Error('Avatar upload failed.');
  }

  async function handleEditPhoto() {
    if (!currentUserId || !supabase) {
      Alert.alert('Error', 'Please sign in again and retry.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo library access to change your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        ...(imagePickerMediaTypes ? { mediaTypes: imagePickerMediaTypes } : {}),
        allowsEditing: true,
        quality: 0.9,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setAvatarUploading(true);
      const selectedAsset = result.assets[0];
      const uploadedUrl = await uploadAvatarToStorage({
        uri: selectedAsset.uri,
        base64: selectedAsset.base64 || null,
        userId: currentUserId,
      });

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: uploadedUrl })
        .eq('user_id', currentUserId);

      if (updateError) throw updateError;

      setProfile((prev) => ({
        ...(prev || {}),
        avatar_url: uploadedUrl,
      }));
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', error?.message || 'Could not update profile photo.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveBio() {
    if (!currentUserId || !supabase) return;

    try {
      setBioSaving(true);
      const trimmed = bioDraft.trim();

      const { error } = await supabase
        .from('users')
        .update({ bio: trimmed || null })
        .eq('user_id', currentUserId);

      if (error) throw error;

      setProfile((prev) => ({
        ...(prev || {}),
        bio: trimmed,
      }));
      setEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', error?.message || 'Could not update bio.');
    } finally {
      setBioSaving(false);
    }
  }

  async function handleSaveUsername() {
    if (!currentUserId || !supabase) return;

    const normalized = usernameDraft.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,20}$/;

    if (!usernameRegex.test(normalized)) {
      Alert.alert(
        'Invalid username',
        'Use 3-20 characters with lowercase letters, numbers, or underscores.'
      );
      return;
    }

    try {
      setUsernameSaving(true);
      const { error } = await supabase
        .from('users')
        .update({ username: normalized })
        .eq('user_id', currentUserId);

      if (error) {
        if (String(error.message || '').toLowerCase().includes('duplicate')) {
          throw new Error('That username is already taken.');
        }
        throw error;
      }

      setProfile((prev) => ({
        ...(prev || {}),
        username: normalized,
      }));
      setUsernameDraft(normalized);
      setEditingUsername(false);
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', error?.message || 'Could not update username.');
    } finally {
      setUsernameSaving(false);
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
            <Text style={styles.listName}>{getUserName(item)}</Text>
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
            <Text style={styles.listName}>{getUserName(item)}</Text>
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
            source={
              profile?.avatar_url
                ? { uri: profile.avatar_url }
                : require('@/assets/images/default_user.jpg')
            }
            style={styles.avatar}
        />
        <Pressable
          style={styles.editPhotoButton}
          onPress={handleEditPhoto}
          disabled={avatarUploading}
        >
          <Text style={styles.editPhotoButtonText}>
            {avatarUploading ? 'Uploading...' : 'Edit photo'}
          </Text>
        </Pressable>

        {!editingUsername ? (
          <>
            <Text style={styles.name}>{userName}</Text>
            <Pressable
              style={styles.editUsernameButton}
              onPress={() => {
                setUsernameDraft(profile?.username || '');
                setEditingUsername(true);
              }}
            >
              <Text style={styles.editUsernameButtonText}>Edit username</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.editUsernameContainer}>
            <TextInput
              style={styles.usernameInput}
              placeholder="username"
              placeholderTextColor="#9CA3AF"
              value={usernameDraft}
              onChangeText={(text) =>
                setUsernameDraft(text.replace(/\s+/g, '').toLowerCase().slice(0, 20))
              }
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <View style={styles.editUsernameActions}>
              <Pressable
                style={[styles.usernameActionButton, styles.usernameCancelButton]}
                onPress={() => {
                  setUsernameDraft(profile?.username || '');
                  setEditingUsername(false);
                }}
                disabled={usernameSaving}
              >
                <Text style={styles.usernameCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.usernameActionButton, styles.usernameSaveButton]}
                onPress={handleSaveUsername}
                disabled={usernameSaving}
              >
                <Text style={styles.usernameSaveButtonText}>
                  {usernameSaving ? 'Saving...' : 'Save username'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        <Text style={styles.subtitle}>{profile?.bio?.trim() || 'This is your profile page.'}</Text>
        {!editingBio ? (
          <Pressable
            style={styles.editBioButton}
            onPress={() => {
              setBioDraft(profile?.bio || '');
              setEditingBio(true);
            }}
          >
            <Text style={styles.editBioButtonText}>Edit bio</Text>
          </Pressable>
        ) : (
          <View style={styles.editBioContainer}>
            <TextInput
              style={styles.bioInput}
              placeholder="Write your bio..."
              placeholderTextColor="#9CA3AF"
              value={bioDraft}
              onChangeText={(text) => setBioDraft(text.slice(0, 160))}
              multiline
              maxLength={160}
            />
            <View style={styles.editBioActions}>
              <Pressable
                style={[styles.bioActionButton, styles.bioCancelButton]}
                onPress={() => {
                  setBioDraft(profile?.bio || '');
                  setEditingBio(false);
                }}
                disabled={bioSaving}
              >
                <Text style={styles.bioCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.bioActionButton, styles.bioSaveButton]}
                onPress={handleSaveBio}
                disabled={bioSaving}
              >
                <Text style={styles.bioSaveButtonText}>{bioSaving ? 'Saving...' : 'Save bio'}</Text>
              </Pressable>
            </View>
          </View>
        )}

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

        <Pressable
          style={styles.savesButton}
          onPress={() =>
            router.push({
              pathname: '/home/saves',
              params: { fromRoute: 'profile' },
            })
          }
        >
          <Text style={styles.savesButtonText}>Saves</Text>
        </Pressable>

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
    marginBottom: 10,
  },
  editPhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  editPhotoButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  editUsernameButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  editUsernameButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  editUsernameContainer: {
    width: '100%',
    marginBottom: 10,
  },
  usernameInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 14,
  },
  editUsernameActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  usernameActionButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  usernameCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  usernameSaveButton: {
    backgroundColor: '#111827',
  },
  usernameCancelButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  usernameSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  editBioButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  editBioButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  editBioContainer: {
    width: '100%',
    marginBottom: 14,
  },
  bioInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#111827',
    fontSize: 14,
  },
  editBioActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bioActionButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bioCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  bioSaveButton: {
    backgroundColor: '#111827',
  },
  bioCancelButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  bioSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  savesButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  savesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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