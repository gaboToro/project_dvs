import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { theme } from '@/lib/theme';

type BackButtonProps = {
  label?: string;
  fallbackHref?: string;
  onPress?: () => void;
};

export function BackButton({
  label = 'Volver',
  fallbackHref = '/home',
  onPress,
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.replace(fallbackHref);
  };

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      <Text style={styles.text}>&lt;- {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  text: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 12,
  },
});
