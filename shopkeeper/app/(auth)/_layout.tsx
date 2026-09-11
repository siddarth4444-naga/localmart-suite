import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="customer-login" />
      <Stack.Screen name="customer-onboarding" />
      <Stack.Screen name="shopkeeper-login" />
    </Stack>
  );
}
