import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';
import { getFollowingList, getUserName } from '@/FE-services/follows.service';
import { createGroupChat } from '@/lib/groupChats.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

export default function CreateGroupChatScreen() {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [following, setFollowing] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadFollowing() {
      if (!user?.id) {
        if (active) {
          setFollowing([]);
          setLoading(false);
        }
        return;
      }
      try {
        setLoading(true);
        const rows = await getFollowingList(user.id);
        if (!active) return;
        setFollowing(Array.isArray(rows) ? rows : []);
      } catch (error) {
        if (active) {
          Alert.alert('Error', 'Could not load following list.');
          setFollowing([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFollowing();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);

  function toggleSelected(userId) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSave() {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to create a group chat.');
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a group name.');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('Add people', 'Select at least one person from your following list.');
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      const chatId = await createGroupChat({
        ownerId: user.id,
        name: trimmedName,
        description,
        memberIds: selectedIds,
      });
      router.replace(`/home/group-chats/${chatId}`);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not create group chat.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />
      <View style={styles.foreground}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={30} color={DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Group Chat</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Group name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter a group name..."
            placeholderTextColor="#9b8080"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Write a short group description..."
            placeholderTextColor="#9b8080"
            multiline
          />

          <View style={styles.followingHeaderRow}>
            <Text style={styles.label}>Add from following</Text>
            <Text style={styles.selectedCount}>{selectedCount} selected</Text>
          </View>

          {loading ? (
            <Text style={styles.helperText}>Loading following...</Text>
          ) : following.length === 0 ? (
            <Text style={styles.helperText}>You are not following anyone yet.</Text>
          ) : (
            <View style={styles.followingList}>
              {following.map((person) => {
                const isSelected = selectedIds.includes(person.user_id);
                return (
                  <Pressable
                    key={person.user_id}
                    style={[styles.personRow, isSelected && styles.personRowSelected]}
                    onPress={() => toggleSelected(person.user_id)}>
                    <View style={styles.personTextWrap}>
                      <Text style={styles.personName}>{getUserName(person)}</Text>
                      {!!person?.bio ? (
                        <Text style={styles.personBio} numberOfLines={1}>
                          {person.bio}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={isSelected ? '#9f7f7f' : '#7f6666'}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Creating...' : 'Create Group'}</Text>
          </Pressable>
        </View>
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  formCard: {
    borderWidth: 1,
    borderColor: '#c4adad',
    borderRadius: 12,
    backgroundColor: '#f5e1e1',
    padding: 14,
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
  followingHeaderRow: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCount: {
    fontFamily: 'Gaegu-Bold',
    color: '#7f6666',
    fontSize: responsive(17, 14, 20),
  },
  helperText: {
    fontFamily: 'Gaegu-Bold',
    color: '#7f6666',
    fontSize: responsive(16, 14, 20),
    marginBottom: 14,
  },
  followingList: {
    marginBottom: 14,
    gap: 8,
  },
  personRow: {
    borderWidth: 1,
    borderColor: '#c6a6a6',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  personRowSelected: {
    backgroundColor: '#f8ecec',
    borderColor: '#b99696',
  },
  personTextWrap: {
    flex: 1,
  },
  personName: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(20, 16, 24),
  },
  personBio: {
    fontFamily: 'Gaegu-Bold',
    color: '#8a7474',
    fontSize: responsive(14, 12, 17),
    marginTop: 2,
  },
});
