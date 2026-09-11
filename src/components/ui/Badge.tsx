import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  text: string;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
}

export default function Badge({
  text,
  color = '#FFFFFF',
  backgroundColor = '#10B981',
  size = 'md',
}: BadgeProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  sizeMd: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
