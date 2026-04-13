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
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '@/context/UserContext';
import {
    getFollowersCount,
    getFollowingCount,
    getFollowersList,
    getFollowingList,
    isFollowing,
    followUser,
    unfollowUser,
    getUserProfile,
    getDisplayName,
} from '@/services/follows.service';