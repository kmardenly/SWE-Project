import * as ImagePicker from 'expo-image-picker';

// Frontend-only picker for now.
// Future backend integration point:
// replace the returned local URI with an uploaded CDN/storage URL.
export async function pickChatImageFromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { cancelled: true, reason: 'permission_denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
    selectionLimit: 1,
  });

  if (result.canceled || !result.assets?.length) {
    return { cancelled: true, reason: 'user_cancelled' };
  }

  const asset = result.assets[0];
  return {
    cancelled: false,
    localUri: asset.uri,
    fileName: asset.fileName ?? `chat-image-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileSize: asset.fileSize ?? null,
  };
}

// Backend stub: later replace with storage upload logic.
// It currently keeps local URI so UI can render immediately.
export async function resolveChatImageUriForMessage(pickedAsset) {
  return pickedAsset.localUri;
}
