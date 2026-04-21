import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';

function formatTagChip(tag) {
    const safe = String(tag || '').trim().replace(/^#/, '');
    return safe ? `#${safe}` : '';
}

export default function SearchTagChips({ tags = [], onRemove }) {
    if (!tags.length) return null;

    return (
        <View style={styles.chipsWrap}>
            {tags.map((tag) => (
                <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>{formatTagChip(tag)}</Text>
                    <Pressable onPress={() => onRemove?.(tag)} hitSlop={8}>
                        <Ionicons
                            name="close"
                            size={responsive(14, 12, 16)}
                            color={DARK}
                        />
                    </Pressable>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f6dcdc',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    chipText: {
        fontFamily: 'Gaegu',
        fontSize: responsive(16, 14, 18),
        color: DARK,
    },
});