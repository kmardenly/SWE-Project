import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function OtherProfileScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/default_user.jpg')} style={styles.avatar} />
      <Text style={styles.name}>Other Profile</Text>
      <Text style={styles.subtitle}>Viewing user: {id ?? 'unknown'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
