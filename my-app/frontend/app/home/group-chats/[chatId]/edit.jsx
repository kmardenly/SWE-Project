import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

import {
  fetchGroupChat,
  normalizeRouteChatId,
  updateGroupDetails,
} from '@/lib/groupChats.service';
import { supabase } from '@/lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

const GROUP_IMAGE_BUCKETS = [
  process.env.EXPO_PUBLIC_SUPABASE_POSTS_BUCKET,
  'images',
  'post-media',
].filter(Boolean);

const imagePickerMediaTypes =
  ImagePicker?.MediaType?.Images ??
  ImagePicker?.MediaTypeOptions?.Images;

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

async function uploadGroupImageToStorage({ groupId, userId, uri, base64 }) {
  if (!supabase || !groupId || !userId || !uri) {
    throw new Error('Missing group image upload data.');
  }
  const ext = fileExtensionFromUri(uri);
  // Keep user id as first folder segment for common storage RLS policies.
  const filePath = `${userId}/group-images/${groupId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

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
  for (const bucket of GROUP_IMAGE_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(filePath, uploadBody, {
      cacheControl: '3600',
      upsert: false,
      contentType: base64 ? `image/${ext}` : uploadBody.type || `image/${ext}`,
    });
    if (error) {
      lastError = error;
      continue;
    }

    // Store as "bucket/path" so it can be resolved for any viewer/device.
    return `${bucket}/${filePath}`;
  }

  if (String(lastError?.message || '').toLowerCase().includes('bucket')) {
    throw new Error(
      `Could not find an upload bucket. Tried: ${GROUP_IMAGE_BUCKETS.join(', ')}`
    );
  }
  throw lastError || new Error('Could not upload group image.');
}

export default function EditGroupDetailsScreen() {
  const params = useLocalSearchParams();
  const chatId = normalizeRouteChatId(params.chatId);
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!chatId) {
        router.back();
        return;
      }
      try {
        setLoading(true);
        const chat = await fetchGroupChat(chatId);
        if (!mounted) return;
        if (!chat) {
          router.back();
          return;
        }
        setName(chat.name || '');
        setDescription(chat?.settings?.description || '');
        setImageUrl(chat.coverImage || '');
      } catch (error) {
        if (mounted) Alert.alert('Error', 'Could not load group details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [chatId]);

  async function handlePickImage() {
    if (!chatId || !user?.id || imageBusy) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        ...(imagePickerMediaTypes ? { mediaTypes: imagePickerMediaTypes } : {}),
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;

      setImageBusy(true);
      const asset = result.assets[0];
      const nextUrl = await uploadGroupImageToStorage({
        groupId: chatId,
        userId: user.id,
        uri: asset.uri,
        base64: asset.base64 || null,
      });
      setImageUrl(nextUrl);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not update group image.');
    } finally {
      setImageBusy(false);
    }
  }

  async function handleSave() {
    if (!chatId || saving) return;
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a group name.');
      return;
    }
    try {
      setSaving(true);
      await updateGroupDetails({
        groupId: chatId,
        name,
        description,
        image: imageUrl || null,
      });
      router.replace(`/home/group-chats/${chatId}/more`);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not save group changes.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={DARK} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Image source={require('@/assets/images/explore_background.png')} resizeMode="cover" style={styles.backgroundLayer} />
      <View style={styles.foreground}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={30} color={DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Group</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Pressable style={styles.imagePicker} onPress={handlePickImage} disabled={imageBusy}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.groupImage} />
            ) : (
              <View style={styles.groupImagePlaceholder}>
                <Ionicons name="image-outline" size={36} color={DARK} />
              </View>
            )}
            <Text style={styles.imagePickerText}>{imageBusy ? 'Uploading...' : 'Change group photo'}</Text>
          </Pressable>

          <Text style={styles.label}>Group name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter a group name..."
            placeholderTextColor="#9b8080"
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Write a short group description..."
            placeholderTextColor="#9b8080"
            style={[styles.input, styles.multilineInput]}
            multiline
          />

          <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </ScrollView>
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
  },
  foreground: {
    flex: 1,
    paddingTop: responsive(58, 48, 70),
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(36, 26, 42),
    color: DARK,
  },
  spacer: {
    width: 30,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 16,
  },
  groupImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d9d9d9',
  },
  groupImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8d8d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: DARK,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 16, 24),
  },
  label: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(24, 18, 28),
    color: DARK,
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(20, 16, 24),
    borderWidth: 1,
    borderColor: '#c6a6a6',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#9f7f7f',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 16, 24),
    color: '#fff',
  },
});
