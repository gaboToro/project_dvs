import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/lib/theme';

type ScreenProps = {
  children: ReactNode;
  contentStyle?: ViewStyle;
};

export function Screen({ children, contentStyle }: ScreenProps) {
  return (
    <LinearGradient
      colors={[theme.colors.haze, theme.colors.mist, '#FFFFFF']}
      locations={[0, 0.6, 1]}
      style={styles.root}
    >
      <SafeAreaView style={[styles.content, contentStyle]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
