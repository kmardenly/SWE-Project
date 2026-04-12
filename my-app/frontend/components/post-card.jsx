import { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PostCard({ post }) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments ?? []);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      username: '@you',
      text: commentText.trim(),
      time: 'just now',
    };
    setComments(prev => [...prev, newComment]);
    setCommentText('');
  };

  return (
    <View style={styles.card}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.avatarCircle}>
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={38} color="#888" />
          )}
        </View>
        <Text style={styles.postUsername}>{post.username}</Text>
      </View>

      {/* Post Image */}
      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />
      ) : (
        <View style={styles.postImagePlaceholder}>
          <Ionicons name="image-outline" size={48} color="#bbb" />
        </View>
      )}

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {post.tags.map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Comments Section */}
      <Text style={styles.commentsTitle}>comments</Text>

      {/* Add Comment Row */}
      <View style={styles.addCommentRow}>
        <View style={styles.avatarCircleSmall}>
          <Ionicons name="person-circle-outline" size={32} color="#888" />
        </View>
        <TextInput
          style={styles.commentInput}
          placeholder="add a comment..."
          placeholderTextColor="#aaa"
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={handleAddComment}
          returnKeyType="send"
        />
      </View>

      <View style={styles.divider} />

      {/* Existing Comments */}
      {comments.map(comment => (
        <View key={comment.id} style={styles.commentRow}>
          <View style={styles.avatarCircleSmall}>
            {comment.avatar ? (
              <Image source={{ uri: comment.avatar }} style={styles.avatarImageSmall} />
            ) : (
              <Ionicons name="person-circle-outline" size={32} color="#888" />
            )}
          </View>
          <View style={styles.commentBody}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentUsername}>{comment.username}</Text>
              <Text style={styles.commentTime}>  {comment.time}</Text>
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginTop: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  postUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  postImage: {
    width: '100%',
    height: 340,
  },
  postImagePlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: {
    paddingHorizontal: 16,
    paddingTop: 10,
    fontSize: 14,
    color: '#333',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 13,
    color: '#444',
  },
  divider: {
    height: 1,
    backgroundColor: '#ececec',
    marginVertical: 10,
    marginHorizontal: 16,
  },
  commentsTitle: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 4,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 13,
    color: '#444',
    marginTop: 2,
  },
});