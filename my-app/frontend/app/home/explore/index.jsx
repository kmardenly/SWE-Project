import { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { EXPLORE_ITEMS } from '@/constants/exploreItems';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;

const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';
const CREAM_SEARCH = '#faf6ef';

function itemMatchesQuery(item, rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    item.craftType.toLowerCase().includes(q) || item.title.toLowerCase().includes(q)
  );
}

const H_PAD = responsive(16, 12, 24);
const COLUMN_GAP = responsive(8, 6, 12);
const COL_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COLUMN_GAP) / 2;

function CraftCard({ item }) {
  return (
    <Pressable
      onPress={() => router.push(`/home/explore/${item.id}`)}
      style={({ pressed }) => [pressed && styles.cardPressed]}>
      <View>
        <View style={styles.cardImagePlaceholder} />
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.craftType}>{item.craftType}</Text>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => EXPLORE_ITEMS.filter((item) => itemMatchesQuery(item, query)),
    [query]
  );

  const leftCol = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 === 1);

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />
      <View style={styles.foreground} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={styles.searchShell}>
                <Ionicons name="search" size={responsive(20, 18, 24)} color={DARK} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="search..."
                  placeholderTextColor="#a08080"
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
              </View>
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  No crafts match &quot;{query.trim()}&quot;. Try another word.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.gridScroll}
                contentContainerStyle={styles.gridContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
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
        </TouchableWithoutFeedback>
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
  content: {
    flex: 1,
    paddingBottom: responsive(16, 12, 24),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsive(56, 48, 68),
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
  },
  searchShell: {
    flex: 1,
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
    backgroundColor: '#000000',
    borderRadius: responsive(12, 10, 14),
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 17, 24),
    color: DARK,
    paddingTop: 8,
  },
});
