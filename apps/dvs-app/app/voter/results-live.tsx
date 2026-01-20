import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { LiveResultsPanel } from '@/components/LiveResultsPanel';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { clearToken, decodeJwtSubject, getRole, getToken } from '@/lib/auth';
import { theme } from '@/lib/theme';

type UserProfile = {
  fullName?: string | null;
};

export default function VoterLiveResultsScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'admin') {
        Alert.alert('Acceso denegado', 'Solo los votantes pueden ver resultados en vivo.');
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

  const menuItems = [
    { label: 'Votaciones', onPress: () => router.push('/voter/elections') },
    { label: 'Resultados', onPress: () => router.push('/results') },
    {
      label: 'Salir',
      onPress: async () => {
        await clearToken();
        router.replace('/login');
      },
    },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          BIENVENID@{fullName ? ` ${fullName}` : ''}
        </Text>
      </View>
      <LiveResultsPanel title="Resultados en vivo" menuItems={menuItems} />
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
