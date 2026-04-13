import { Image, StyleSheet, Text, View } from 'react-native';
import { useUser } from '@/context/UserContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getFollowersCount,
  getFollowingCount,
  getFollowersList,
  getFollowingList,
  unfollowUser,
  removeFollower,
  getDisplayName,
} from '@/services/follows.service';


export default function ProfileScreen() {
  const { user } = useUser();
  const displayName = user?.user_metadata?.display_name || user?.email || 'Crafter';

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/default_user.jpg')} style={styles.avatar} />
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.subtitle}>This is your profile page.</Text>
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
