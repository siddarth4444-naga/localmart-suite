import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return { button: styles.bgSecondary, text: styles.textSecondary };
      case 'danger':
        return { button: styles.bgDanger, text: styles.textWhite };
      case 'ghost':
        return { button: styles.bgGhost, text: styles.textGhost };
      case 'primary':
      default:
        return { button: styles.bgPrimary, text: styles.textWhite };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle; iconSize: number } => {
    switch (size) {
      case 'sm':
        return { button: styles.sizeSm, text: styles.textSm, iconSize: 16 };
      case 'lg':
        return { button: styles.sizeLg, text: styles.textLg, iconSize: 24 };
      case 'md':
      default:
        return { button: styles.sizeMd, text: styles.textMd, iconSize: 20 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles.button,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#10B981'} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.text.color as string}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, variantStyles.text, sizeStyles.text]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  // Variants
  bgPrimary: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  bgSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#10B981',
  },
  textSecondary: {
    color: '#10B981',
  },
  bgDanger: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bgGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  textGhost: {
    color: '#10B981',
  },
  // Sizes
  sizeSm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textSm: {
    fontSize: 14,
  },
  sizeMd: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textMd: {
    fontSize: 16,
  },
  sizeLg: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  textLg: {
    fontSize: 18,
  },
});
