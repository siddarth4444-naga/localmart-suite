import { Stack } from 'expo-router';

export default function ShopkeeperLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-product" 
        options={{ 
          presentation: 'modal',
          title: 'Add Product',
          headerStyle: { backgroundColor: '#10B981' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="edit-product/[id]" 
        options={{ 
          title: 'Edit Product',
          headerStyle: { backgroundColor: '#10B981' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="order-detail/[id]" 
        options={{ 
          title: 'Order Details',
          headerStyle: { backgroundColor: '#10B981' },
          headerTintColor: '#fff',
        }} 
      />
    </Stack>
  );
}
