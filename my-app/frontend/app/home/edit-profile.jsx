import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import { getUserName } from '@/FE-services/follows.service';
import { resolveAvatarUrl } from '@/lib/resolveAvatarUrl';
import { supabase } from '@/lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const H_PAD = responsive(16, 12, 24);

const DARK = '#5c3d3d';
const PAGE_BG = '#fdf5f3';

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
  ImagePicker?.MediaType?.Images ?? ImagePicker?.MediaTypeOptions?.Images;

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!currentUserId || !supabase) {
      setLoading(false);
      setProfile(null);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, username, display_name, avatar_url, bio, level')
      .eq('user_id', currentUserId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
      return;
    }

    const avatarUrl = await resolveAvatarUrl(data?.avatar_url || '');
    setProfile({ ...(data || {}), avatar_url: avatarUrl });
    setBioDraft(data?.bio || '');
    setUsernameDraft(data?.username || '');
    setLoading(false);
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const userName = getUserName(profile);

  async function uploadAvatarToStorage({ uri, base64, userId }) {
    if (!uri || !userId || !supabase) {
      throw new Error('Missing avatar upload requirements.');
    }

    const ext = fileExtensionFromUri(uri);
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

  if (loading && !profile) {
    return (
      <View style={styles.root}>
        <ImageBackground
          source={require('@/assets/images/goal_bg.png')}
          resizeMode="cover"
          style={styles.backgroundLayer}
        />
        <View style={[styles.loadingWrap, styles.foreground]}>
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
        <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            style={({ pressed }) => [styles.headerBack, pressed && styles.headerBackPressed]}
            onPress={() => router.replace('/home/profile')}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={responsive(24, 20, 28)} color={DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.previewRow}>
          <Image
            source={
              profile?.avatar_url
                ? { uri: profile.avatar_url }
                : require('@/assets/images/default_user.jpg')
            }
            style={styles.previewAvatar}
          />
          <View style={styles.previewTextCol}>
            <Text style={styles.previewName}>{userName}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, avatarUploading && styles.primaryButtonDisabled]}
          onPress={handleEditPhoto}
          disabled={avatarUploading}
        >
          <Text style={styles.primaryButtonText}>
            {avatarUploading ? 'Uploading photo…' : 'Change profile photo'}
          </Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Username</Text>
        {!editingUsername ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionValue}>{profile?.username || '—'}</Text>
            <Pressable
              style={styles.inlineEditBtn}
              onPress={() => {
                setUsernameDraft(profile?.username || '');
                setEditingUsername(true);
              }}
            >
              <Text style={styles.inlineEditBtnText}>Edit</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.editBlock}>
            <TextInput
              style={styles.input}
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
            <View style={styles.editActions}>
              <Pressable
                style={[styles.smallBtn, styles.smallBtnMuted]}
                onPress={() => {
                  setUsernameDraft(profile?.username || '');
                  setEditingUsername(false);
                }}
                disabled={usernameSaving}
              >
                <Text style={styles.smallBtnMutedText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.smallBtn, styles.smallBtnDark]}
                onPress={handleSaveUsername}
                disabled={usernameSaving}
              >
                <Text style={styles.smallBtnDarkText}>
                  {usernameSaving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>Bio</Text>
        {!editingBio ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionValue} numberOfLines={4}>
              {profile?.bio?.trim() || 'No bio yet.'}
            </Text>
            <Pressable
              style={styles.inlineEditBtn}
              onPress={() => {
                setBioDraft(profile?.bio || '');
                setEditingBio(true);
              }}
            >
              <Text style={styles.inlineEditBtnText}>Edit</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.editBlock}>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Write your bio…"
              placeholderTextColor="#9CA3AF"
              value={bioDraft}
              onChangeText={(text) => setBioDraft(text.slice(0, 160))}
              multiline
              maxLength={160}
            />
            <View style={styles.editActions}>
              <Pressable
                style={[styles.smallBtn, styles.smallBtnMuted]}
                onPress={() => {
                  setBioDraft(profile?.bio || '');
                  setEditingBio(false);
                }}
                disabled={bioSaving}
              >
                <Text style={styles.smallBtnMutedText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.smallBtn, styles.smallBtnDark]}
                onPress={handleSaveBio}
                disabled={bioSaving}
              >
                <Text style={styles.smallBtnDarkText}>{bioSaving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        )}
        </ScrollView>
      </View>
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
  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerBackPressed: {
    opacity: 0.88,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 18, 26),
    color: DARK,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 40,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  previewAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e8e0dc',
  },
  previewTextCol: {
    flex: 1,
  },
  previewName: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(24, 20, 28),
    color: DARK,
  },
  primaryButton: {
    backgroundColor: '#f5d0d0',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#5c3d3d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 16, 22),
    color: DARK,
  },
  sectionLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 16, 20),
    color: DARK,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(92,61,61,0.12)',
  },
  sectionValue: {
    flex: 1,
    fontSize: 15,
    color: '#4b3f3c',
    lineHeight: 22,
  },
  inlineEditBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f5e6e6',
  },
  inlineEditBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
  },
  editBlock: {
    marginBottom: 22,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: 'rgba(92,61,61,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 15,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  smallBtnMuted: {
    backgroundColor: '#ede4e2',
  },
  smallBtnMutedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5c4a45',
  },
  smallBtnDark: {
    backgroundColor: DARK,
  },
  smallBtnDarkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
