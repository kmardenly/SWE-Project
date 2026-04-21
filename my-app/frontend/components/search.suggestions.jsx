import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';

export default function SearchSuggestions({
                                              visible,
                                              loading = false,
                                              users = [],
                                              tags = [],
                                              onUserPress,
                                              onTagPress,
                                          }) {
    if (!visible) return null;

    return (
        <View style={styles.dropdown}>
            {loading ? (
                <Text style={styles.dropdownLoadingText}>Searching...</Text>
            ) : (
                <>
                    {users.length > 0 && (
                        <View style={styles.dropdownSection}>
                            <Text style={styles.dropdownSectionTitle}>Users</Text>
                            {users.map((user) => (
                                <Pressable
                                    key={user.id}
                                    style={({ pressed }) => [
                                        styles.dropdownRow,
                                        pressed && styles.dropdownRowPressed,
                                    ]}
                                    onPress={() => onUserPress?.(user)}
                                >
                                    {user.avatarUrl ? (
                                        <Image
                                            source={{ uri: user.avatarUrl }}
                                            style={styles.userAvatar}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={[styles.userAvatar, styles.userAvatarFallback]}>
                                            <Ionicons
                                                name="person-outline"
                                                size={responsive(16, 14, 18)}
                                                color={DARK}
                                            />
                                        </View>
                                    )}
                                    <Text style={styles.dropdownRowText}>@{user.username}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {tags.length > 0 && (
                        <View style={styles.dropdownSection}>
                            <Text style={styles.dropdownSectionTitle}>Tags</Text>
                            {tags.map((tag) => (
                                <Pressable
                                    key={tag.id}
                                    style={({ pressed }) => [
                                        styles.dropdownRow,
                                        pressed && styles.dropdownRowPressed,
                                    ]}
                                    onPress={() => onTagPress?.(tag)}
                                >
                                    <Ionicons
                                        name="pricetag-outline"
                                        size={responsive(16, 14, 18)}
                                        color={DARK}
                                        style={styles.dropdownTagIcon}
                                    />
                                    <Text style={styles.dropdownRowText}>#{tag.name}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    dropdown: {
        marginTop: 8,
        backgroundColor: '#fffaf5',
        borderRadius: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    dropdownSection: {
        paddingVertical: 4,
    },
    dropdownSectionTitle: {
        fontFamily: 'Gafata',
        fontSize: responsive(13, 12, 15),
        color: '#8b6e6e',
        paddingHorizontal: 14,
        paddingTop: 4,
        paddingBottom: 6,
    },
    dropdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    dropdownRowPressed: {
        backgroundColor: '#f4e7df',
    },
    dropdownRowText: {
        fontFamily: 'Gaegu',
        fontSize: responsive(18, 16, 20),
        color: DARK,
    },
    dropdownTagIcon: {
        marginRight: 10,
    },
    dropdownLoadingText: {
        fontFamily: 'Gaegu',
        fontSize: responsive(18, 16, 20),
        color: DARK,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    userAvatar: {
        width: responsive(28, 24, 32),
        height: responsive(28, 24, 32),
        borderRadius: responsive(14, 12, 16),
        marginRight: 10,
        backgroundColor: '#e8d9d1',
    },
    userAvatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});