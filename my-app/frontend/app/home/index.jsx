import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {homeStyles} from '../../constants/homeStyles';
//import { Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import  {useUser} from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import NotificationModal from '@/components/notificationScreen';

// Mock notifications — replace with real data later
const MOCK_NOTIFICATIONS = [
  { id: '1', message: 'Your project "Oak Table" was saved.', time: '2m ago' },
  { id: '2', message: 'New comment on "Walnut Shelf".', time: '1h ago' },
  { id: '3', message: 'Material restock reminder: Pine boards.', time: '3h ago' },
];


export default function HomeScreen() {
  const { user } = useUser();
  const handleLogout = () => {
    router.replace('/');
  };

  const [search, setSearch] = useState('');
  const [notifVisible, setNotifVisible] = useState(false); // ← add this

    let user_text = ""
      if (user !== null && user!== undefined){
        user_text = user.username
      }else{
        user_text = "<User_Placeholder>"
      }

  return (
    <View style={homeStyles.container}>
        <View style = {homeStyles.header}>
          <Text style={homeStyles.title}>My Craft</Text>
          <View style = {homeStyles.headerRight}>
            <View style = {homeStyles.searchContainer}>
              <Ionicons name = "search-outline" size = {16} color = "#888"/>
              <TextInput
              style = {homeStyles.searchInput}
              placeholder = "Search!"
              placeholderTextColor = "#888"
              value = {search}
                onChangeText = {setSearch}
            />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name = "close-circle" size = {16} color = "#888"/>
                </Pressable>
              )}
            </View>
            
            <Pressable style={homeStyles.button} onPress={handleLogout}>
              <Text style={homeStyles.buttonText}>Log Out</Text>
            </Pressable>
          </View>
      </View>
     

      
      <Text style = {homeStyles.welcome}>Welcome back, {user_text}!</Text>
      
       <Pressable style={homeStyles.notifications} onPress={() => setNotifVisible(true)}>
          <Ionicons name="notifications-outline" size={16} color="#888" /> 
          <Text style={homeStyles.notificationsText}>notifications</Text>
      </Pressable>

      
      
      <Text style={homeStyles.subtitle}>You are logged in.</Text>
      
      <NotificationModal
      visible={notifVisible}
      onClose={() => setNotifVisible(false)}
      notifications={MOCK_NOTIFICATIONS}
    />
     
    </View>
  );
}