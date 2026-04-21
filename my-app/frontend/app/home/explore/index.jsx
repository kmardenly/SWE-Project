import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { fetchExploreItems } from '@/constants/exploreItems';
import {
  filterPostsBySearch,
  getTagSuggestions,
  getUserSuggestions,
  normalizeSelectedTag,
  shouldShowSuggestions,
} from '@/FE-services/search.service';
import SearchSuggestions from '@/components/search.suggestions';
import SearchTagChips from '@/components/search.tag.chips';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;

const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';
const CREAM_SEARCH = '#faf6ef';

const H_PAD = responsive(16, 12, 24);
const COLUMN_GAP = responsive(8, 6, 12);
const COL_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COLUMN_GAP) / 2;

function CraftCard({ item }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
      <Pressable
          onPress={() =>
            router.push({
              pathname: '/home/explore/[id]',
              params: { id: item.id, fromRoute: 'explore' },
            })
          }
          style={({ pressed }) => [pressed && styles.cardPressed]}
      >
        <View>
          {item.imageUrl && !imageFailed ? (
              <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.cardImagePlaceholder}
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
              />
          ) : (
              <View style={styles.cardImagePlaceholder}>
                <Text style={styles.missingImageText}>image unavailable</Text>
              </View>
          )}
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.craftType}>{item.craftType}</Text>
        </View>
      </Pressable>
  );
}

export default function ExploreScreen() {
  const [draftQuery, setDraftQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedDraftTags, setSelectedDraftTags] = useState([]);
  const [submittedTags, setSubmittedTags] = useState([]);

  const [userSuggestions, setUserSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const resetSearch = useCallback(() => {
    setDraftQuery('');
    setSubmittedQuery('');
    setSelectedDraftTags([]);
    setSubmittedTags([]);
    setUserSuggestions([]);
    setTagSuggestions([]);
    setShowSuggestions(false);
    setSuggestionsLoading(false);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const next = await fetchExploreItems();
      setItems(next);
    } catch (error) {
      setLoadError(error?.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
      useCallback(() => {
        loadItems();
      }, [loadItems])
  );

  useEffect(() => {
    if (!shouldShowSuggestions(draftQuery)) {
      setUserSuggestions([]);
      setTagSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);

        const [users, tags] = await Promise.all([
          getUserSuggestions(draftQuery),
          getTagSuggestions(draftQuery, selectedDraftTags),
        ]);

        if (cancelled) return;

        setUserSuggestions(users);
        setTagSuggestions(tags);
        setShowSuggestions(users.length > 0 || tags.length > 0);
      } catch (error) {
        if (cancelled) return;
        setUserSuggestions([]);
        setTagSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [draftQuery, selectedDraftTags]);

  const filtered = useMemo(
      () => filterPostsBySearch(items, submittedQuery, submittedTags),
      [items, submittedQuery, submittedTags]
  );

  const leftCol = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 === 1);

  const hasSubmittedSearch =
      !!submittedQuery.trim() || submittedTags.length > 0;

  const handleChangeText = useCallback(
      (text) => {
        setDraftQuery(text);

        if (!text.trim() && selectedDraftTags.length === 0) {
          resetSearch();
        }
      },
      [resetSearch, selectedDraftTags.length]
  );

  const handleSubmitSearch = useCallback(() => {
    setSubmittedQuery(draftQuery.trim());
    setSubmittedTags(selectedDraftTags);
    setShowSuggestions(false);
    Keyboard.dismiss();
  }, [draftQuery, selectedDraftTags]);

  const handleUserPress = useCallback((user) => {
    setShowSuggestions(false);
    Keyboard.dismiss();

    router.push({
      pathname: '/home/other.profile',
      params: { userId: user.id },
    });
  }, []);

  const handleTagPress = useCallback((tag) => {
    const normalized = normalizeSelectedTag(tag.slug || tag.name);
    if (!normalized) return;

    setSelectedDraftTags((prev) => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized];
    });

    setDraftQuery('');
    setUserSuggestions([]);
    setTagSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const handleRemoveTag = useCallback(
      (tagToRemove) => {
        setSelectedDraftTags((prev) => {
          const next = prev.filter((tag) => tag !== tagToRemove);

          if (!next.length && !draftQuery.trim()) {
            setSubmittedTags([]);
            setSubmittedQuery('');
            setUserSuggestions([]);
            setTagSuggestions([]);
            setShowSuggestions(false);
          }

          return next;
        });
      },
      [draftQuery]
  );

  const content = (
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.searchArea}>
            <View style={styles.searchShell}>
              <Ionicons
                  name="search"
                  size={responsive(20, 18, 24)}
                  color={DARK}
                  style={styles.searchIcon}
              />
              <TextInput
                  style={styles.searchInput}
                  placeholder="search..."
                  placeholderTextColor="#a08080"
                  value={draftQuery}
                  onChangeText={handleChangeText}
                  onSubmitEditing={handleSubmitSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
              />
            </View>

            <SearchSuggestions
                visible={showSuggestions}
                loading={suggestionsLoading}
                users={userSuggestions}
                tags={tagSuggestions}
                onUserPress={handleUserPress}
                onTagPress={handleTagPress}
            />

            <SearchTagChips
                tags={selectedDraftTags}
                onRemove={handleRemoveTag}
            />
          </View>
        </View>

        {loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Loading posts...</Text>
            </View>
        ) : loadError ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{loadError}</Text>
            </View>
        ) : filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {hasSubmittedSearch ? 'nothing to see here' : 'No posts yet.'}
              </Text>
            </View>
        ) : (
            <ScrollView
                style={styles.gridScroll}
                contentContainerStyle={styles.gridContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
              <View style={styles.column}>
                {leftCol.map((item) => (
                    <CraftCard key={item.id} item={item} />
                ))}
              </View>
              <View style={styles.column}>
                {rightCol.map((item) => (
                    <CraftCard key={item.id} item={item} />
                ))}
              </View>
            </ScrollView>
        )}
      </View>
  );

  return (
      <View style={styles.root}>
        <Image
            source={require('@/assets/images/explore_background.png')}
            resizeMode="cover"
            style={styles.backgroundLayer}
        />
        <View style={styles.foreground} pointerEvents="box-none">
          {Platform.OS === 'web' ? (
              content
          ) : (
              <Pressable style={styles.contentPressable} onPress={Keyboard.dismiss}>
                {content}
              </Pressable>
          )}
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2e4e4',
    overflow: 'visible',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    width: '100%',
    height: '100%',
  },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentPressable: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: responsive(16, 12, 24),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: responsive(56, 48, 68),
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
    zIndex: 20,
  },
  searchArea: {
    flex: 1,
    zIndex: 20,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CREAM_SEARCH,
    borderRadius: 16,
    paddingHorizontal: responsive(12, 10, 16),
    paddingVertical: responsive(4, 2, 6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 16, 22),
    color: DARK,
    paddingVertical: responsive(10, 8, 12),
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: H_PAD,
    paddingTop: responsive(24, 16, 32),
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 17, 24),
    color: DARK,
    textAlign: 'center',
    opacity: 0.85,
  },
  gridScroll: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: responsive(32, 24, 48),
    gap: COLUMN_GAP,
  },
  column: {
    width: COL_WIDTH,
    gap: COLUMN_GAP,
  },
  cardPressed: {
    opacity: 0.92,
  },
  craftType: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(13, 12, 15),
    color: DARK,
    opacity: 0.9,
    paddingTop: 2,
  },
  cardImagePlaceholder: {
    width: COL_WIDTH,
    height: COL_WIDTH * 0.85,
    backgroundColor: '#e9ddd3',
    borderRadius: responsive(12, 10, 14),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingImageText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 16),
    color: '#8d6f6f',
  },
  cardTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 17, 24),
    color: DARK,
    paddingTop: 8,
  },
});