import {
  Alert,
  Dimensions,
  ImageBackground,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import  {useUser} from '@/context/UserContext';
import {supabase} from "@/lib/supabaseClient";

console.log("supabase client:", supabase);//import supabase debug

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;

const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const CRAFT_TYPES = ['test','knitting', 'crochet', 'embroidery', 'weaving', 'sewing', 'other'];
const PINK = '#c49a9a';
const CREAM = '#f5f0e8';
const DARK = '#5c3d3d';

export default function CreatePostScreen() {
  const {user} = useUser();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [craftType, setCraftType] = useState('');
  const [customCraftType, setCustomCraftType] = useState('');
  const [craftOpen, setCraftOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    Alert.alert('Post shared', 'Your post has been shared! :D');

    if (!supabase) {
      console.log("Supabase is not configured.");
      return;
    }

    console.log('share pressed'); //quick share debug
    //alert('share pressed');
    console.log(user.user_id)


    //inserting new content here
    const content = JSON.stringify({
      title: title.trim(),
      caption: caption.trim(),
      craftType: craftType,
      tags,
    });

    //inserting into post here
    const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            creator_id: user.id,
            content,
          },
        ])
        .select()
        .single();

    if (postError) throw postError;

    if (selectedImageUri) {
      const { error: mediaError } = await supabase
          .from('post_media')
          .insert([
            {
              post_id: post.post_id,
              media_url: selectedImageUri,
              media_type: 'image',
              order: 0,
            },
          ]);

      if (mediaError) throw mediaError;
    }

    alert('Post shared!');
    router.back();

  };

  return (
    <ImageBackground
      source={require('@/assets/images/post_background.png')}
      resizeMode="cover"
      style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={DARK} />
        </Pressable>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.scrollArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

        {/* Image Picker */}
        <View style={styles.imagePicker}>
          {selectedImageUri ? (
            <>
              <Image source={{ uri: selectedImageUri }} style={styles.selectedImage} resizeMode="cover" />
              <Pressable
                style={({ pressed }) => [styles.editImageButton, pressed && styles.editImageButtonPressed]}
                onPress={handlePickImage}>
                <Text style={styles.editImageButtonText}>Edit Photo</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.addImageButton, pressed && styles.addImageButtonPressed]}
              onPress={handlePickImage}>
              <Text style={styles.addImageButtonText}>Add Image</Text>
            </Pressable>
          )}
        </View>

        {/* Title */}
        <View style={styles.field}>
          <TextInput
            style={styles.singleLineInput}
            placeholder="title: [50 char maximum]"
            placeholderTextColor="#b09090"
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, 50))}
            maxLength={50}
          />
        </View>

        {/* Caption */}
        <View style={styles.field}>
          <TextInput
            style={styles.multiLineInput}
            placeholder="caption: [200 char maximum]"
            placeholderTextColor="#b09090"
            value={caption}
            onChangeText={(t) => setCaption(t.slice(0, 200))}
            maxLength={200}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Craft Type */}
        <View style={styles.field}>
          <Pressable
            style={styles.singleLineInput}
            onPress={() => setCraftOpen((o) => !o)}>
            <Text style={craftType ? styles.inputText : styles.placeholderText}>
              {craftType === 'other'
                ? `other: ${customCraftType || ''}`
                : craftType || 'craft type:'}
            </Text>
            <Ionicons
              name={craftOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#b09090"
            />
          </Pressable>
          {craftOpen && (
            <View style={styles.dropdown}>
              {CRAFT_TYPES.map((ct) => (
                <Pressable
                  key={ct}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCraftType(ct);
                    if (ct !== 'other') {
                      setCustomCraftType('');
                    }
                    setCraftOpen(false);
                  }}>
                  <Text style={[styles.dropdownText, craftType === ct && styles.dropdownSelected]}>
                    {ct}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {craftType === 'other' && (
            <TextInput
              style={[styles.singleLineInput, styles.otherInput]}
              placeholder="type your craft category..."
              placeholderTextColor="#b09090"
              value={customCraftType}
              onChangeText={setCustomCraftType}
              maxLength={30}
            />
          )}
        </View>

        {/* Tags */}
        <View style={styles.tagsField}>
          <View style={styles.tagsRow}>
            <Text style={styles.tagsLabel}>tags:</Text>
            <View style={styles.tagsList}>
              {tags.map((tag) => (
                <Pressable key={tag} style={styles.tag} onPress={() => removeTag(tag)}>
                  <Text style={styles.tagText}>x {tag}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.addTagBtn} onPress={addTag}>
                <Text style={styles.addTagText}>+ add tag</Text>
              </Pressable>
            </View>
          </View>
          <TextInput
            style={styles.tagInput}
            placeholder="new tag..."
            placeholderTextColor="#b09090"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
        </View>

        </ScrollView>
      </View>

      <View style={styles.staticShareContainer}>
        <Pressable
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
          onPress={handleShare}>
          <Text style={styles.shareText}>share!</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2e4e4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 52,
    paddingHorizontal: responsive(16, 12, 24),
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: responsive(24, 20, 30),
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    letterSpacing: 1,
  },
  
  scroll: {
    paddingHorizontal: responsive(20, 14, 28),
    paddingBottom: 10,
    paddingTop: responsive(36, 28, 48),
    gap: responsive(16, 12, 20),
  },
  scrollArea: {
    height: '68%',
  },

  /* Image Picker */
  imagePicker: {
    backgroundColor: '#F0D7D7',
    borderRadius: 16,
    height: responsive(250, 210, 310),
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: responsive(12, 10, 16),
    borderWidth: 1,
    borderColor: '#A58E86',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  editImageButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: responsive(14, 12, 18),
    paddingVertical: responsive(8, 6, 10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  editImageButtonPressed: {
    backgroundColor: '#f4ecec',
    transform: [{ scale: 0.98 }],
  },
  editImageButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 16),
    color: DARK,
  },
  imageInputBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageInputText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 15, 19),
    color: DARK,
  },
  addImageButton: {
    alignSelf: 'center',
    marginTop: responsive(90, 70, 120),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(196,154,154,0.55)',
    borderRadius: 10,
    paddingHorizontal: responsive(20, 16, 24),
    paddingVertical: responsive(10, 8, 12),
  },
  addImageButtonPressed: {
    backgroundColor: '#f4ecec',
    transform: [{ scale: 0.98 }],
  },
  addImageButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 18, 26),
    color: DARK,
  },

  /* Fields */
  field: {
    position: 'relative',
  },
  otherInput: {
    marginTop: 6,
  },
  singleLineInput: {
    backgroundColor: '#F0D7D7',
    borderRadius: 12,
    paddingHorizontal: responsive(14, 10, 18),
    paddingVertical: responsive(16, 13, 20),
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(19, 17, 22),
    color: DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#A58E86',
  },
  multiLineInput: {
    backgroundColor: '#F7F0E0',
    borderRadius: 12,
    paddingHorizontal: responsive(14, 10, 18),
    paddingVertical: responsive(14, 12, 18),
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(19, 17, 22),
    color: DARK,
    minHeight: responsive(120, 95, 150),
    borderWidth: 1,
    borderColor: '#A58E86',
  },
  inputText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(19, 17, 22),
    color: DARK,
    flex: 1,
  },
  placeholderText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(19, 17, 22),
    color: '#b09090',
    flex: 1,
  },

  /* Dropdown */
  dropdown: {
    backgroundColor: '#fff8f8',
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#A58E86',
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,154,154,0.15)',
  },
  dropdownText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(19, 17, 22),
    color: DARK,
  },
  dropdownSelected: {
    fontFamily: 'Gaegu-Bold',
    color: PINK,
  },

  /* Tags */
  tagsField: {
    backgroundColor: '#F7F0E0',
    borderRadius: 12,
    padding: responsive(16, 12, 20),
    gap: 10,
    borderWidth: 1,
    borderColor: '#A58E86',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 6,
  },
  tagsLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(19, 17, 22),
    color: DARK,
    marginRight: 4,
    marginTop: 4,
  },
  tagsList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e8d5d5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 15, 20),
    color: DARK,
  },
  addTagBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  addTagText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 15, 20),
    color: '#b09090',
  },
  tagInput: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,154,154,0.2)',
    paddingTop: 8,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 16, 21),
    color: DARK,
  },

  /* Share */
  staticShareContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 114,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: responsive(36, 28, 48),
    paddingVertical: responsive(14, 10, 18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  shareButtonPressed: {
    backgroundColor: '#f4ecec',
    transform: [{ scale: 0.98 }],
  },
  shareText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 18, 26),
    color: DARK,
    letterSpacing: 0.5,
  },
  yarnEmoji: {
    fontSize: responsive(32, 26, 40),
  },
  yarnDecoration: {
    position: 'absolute',
    right: 72,
    bottom: 64,
    width: responsive(192, 144, 240),
    height: responsive(192, 144, 240),
  },
});