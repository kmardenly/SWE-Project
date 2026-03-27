import {Image, Pressable, StyleSheet, Text, TextInput, View} from 'react-native'
import {Ionicons} from '@expo/vector-icons';

// function paramaters: username, avatar, image, caption, tags, comments
// use the function paramaters inorder to populate data to the card
export default function PostCard({
    username = '<user_placeholder>', 
    avatar = require('../assets/images/default_user.jpg'), 
    image = null, 
    caption = 'No caption provided.',
    tags = ['#tag1', '#tag2', '#tag3'],
    comments = [],
}) {
    return(

    );
} 