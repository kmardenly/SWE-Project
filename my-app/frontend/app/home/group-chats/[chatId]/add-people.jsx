import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

import { getFollowersList, getUserName } from '@/FE-services/follows.service';
import { addMembersToGroup, fetchGroupChat, normalizeRouteChatId } from '@/lib/groupChats.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

export default function AddPeopleScreen() {
  const { user } = useUser();
  const params = useLocalSearchParams();
  const chatId = normalizeRouteChatId(params.chatId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [existingIds, setExistingIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!chatId || !user?.id) {
        router.back();
        return;
      }
      try {
        setLoading(true);
        const [followersRows, chat] = await Promise.all([
          getFollowersList(user.id),
          fetchGroupChat(chatId, user.id),
        ]);
        if (!mounted) return;
        setFollowers(Array.isArray(followersRows) ? followersRows : []);
        setExistingIds(Array.isArray(chat?.memberUserIds) ? chat.memberUserIds : []);
      } catch (error) {
        if (mounted) Alert.alert('Error', 'Could not load people to add.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [chatId, user?.id]);

  const selectableFollowers = useMemo(
    () => followers.filter((person) => person?.user_id && !existingIds.includes(person.user_id)),
    [followers, existingIds]
  );

  function toggleSelected(userId) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleAdd() {
    if (!chatId || saving || !selectedIds.length) return;
    try {
      setSaving(true);
      await addMembersToGroup({ groupId: chatId, userIds: selectedIds });
      router.replace(`/home/group-chats/${chatId}/more`);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not add people to this group.');
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
          <Text style={styles.headerTitle}>Add People</Text>
          <View style={styles.spacer} />
        </View>

        <Text style={styles.subhead}>Select followers to add</Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {selectableFollowers.length === 0 ? (
            <Text style={styles.emptyText}>No followers available to add.</Text>
          ) : (
            selectableFollowers.map((person) => {
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
            })
          )}
        </ScrollView>

        <Pressable
          style={[styles.addButton, (!selectedIds.length || saving) && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={!selectedIds.length || saving}>
          <Text style={styles.addButtonText}>
            {saving ? 'Adding...' : `Add ${selectedIds.length || ''} ${selectedIds.length === 1 ? 'Person' : 'People'}`}
          </Text>
        </Pressable>
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
    paddingBottom: 18,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  subhead: {
    fontFamily: 'Gaegu-Bold',
    color: '#7f6666',
    fontSize: responsive(20, 16, 24),
    marginBottom: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 12,
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
  emptyText: {
    fontFamily: 'Gaegu-Bold',
    color: '#7f6666',
    fontSize: responsive(18, 15, 22),
    textAlign: 'center',
    marginTop: 20,
  },
  addButton: {
    alignSelf: 'stretch',
    backgroundColor: '#9f7f7f',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonDisabled: {
    opacity: 0.65,
  },
  addButtonText: {
    textAlign: 'center',
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 16, 24),
    color: '#fff',
  },
});
