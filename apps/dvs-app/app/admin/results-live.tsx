import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { LiveResultsPanel } from '@/components/LiveResultsPanel';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { decodeJwtSubject, getRole, getToken } from '@/lib/auth';
import { theme } from '@/lib/theme';

type UserProfile = {
  fullName?: string | null;
};

export default function AdminLiveResultsScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const userId = decodeJwtSubject(token);
        if (!userId) return;
        const data = await apiRequest<UserProfile>(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        setFullName(data?.fullName ?? null);
      } catch {
        if (active) setFullName(null);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          BIENVENID@{fullName ? ` ${fullName}` : ''}
        </Text>
        <Text style={styles.subtitle}>Resultados en tiempo real.</Text>
      </View>
      <LiveResultsPanel
        title="Resultados en vivo"
        showBack
        backLabel="Inicio"
        backHref="/home"
        BackButton={BackButton}
        onBackPress={() => router.replace('/home')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  welcome: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
  },
});
