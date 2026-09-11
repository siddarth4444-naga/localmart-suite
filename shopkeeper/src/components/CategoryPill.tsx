import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

export default function CategoryPill({ category, isSelected, onPress }: CategoryPillProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        isSelected ? styles.iconContainerSelected : styles.iconContainerUnselected
      ]}>
        <Ionicons 
          name={category.icon} 
          size={24} 
          color={isSelected ? '#FFFFFF' : '#4B5563'} 
        />
      </View>
      <Text 
        style={[
          styles.text,
          isSelected ? styles.textSelected : styles.textUnselected
        ]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 64,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainerUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainerSelected: {
    backgroundColor: '#10B981',
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
  },
  textUnselected: {
    color: '#4B5563',
  },
  textSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
});
