import { Stack } from 'expo-router';

export default function GroupChatsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[chatId]/index" />
      <Stack.Screen name="[chatId]/edit" />
      <Stack.Screen name="[chatId]/add-people" />
      <Stack.Screen name="[chatId]/more" />
    </Stack>
  );
}

