import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'soft';
  icon?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  icon,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'soft' && styles.soft,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text
          style={[
            styles.label,
            variant === 'primary' ? styles.labelPrimary : styles.labelGhost,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  ghost: {
    borderColor: theme.colors.tide,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  soft: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: theme.fonts.subheading,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: theme.colors.ink,
  },
  labelGhost: {
    color: theme.colors.ink,
  },
  icon: {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
