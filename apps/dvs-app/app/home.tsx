import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { clearToken, decodeJwtSubject, getRole, getToken } from '@/lib/auth';
import { theme } from '@/lib/theme';

type UserProfile = {
  fullName?: string | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'voter' | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    getRole().then((stored) => {
      const nextRole = stored as 'admin' | 'voter' | null;
      setRole(nextRole);
      if (nextRole === 'voter') {
        router.replace('/voter/results-live');
      }
    });
  }, []);

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

  const showAdmin = useMemo(() => role === 'admin', [role]);
  const showVoter = useMemo(() => role === 'voter', [role]);
  const showResults = useMemo(() => role === 'voter', [role]);
  const showAdminLive = useMemo(() => role === 'admin', [role]);

  const handleLogout = async () => {
    await clearToken();
    router.replace('/login');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Panel principal</Text>
        <Text style={styles.welcome}>
          BIENVENID@{fullName ? ` ${fullName}` : ''}
        </Text>
        <Text style={styles.subtitle}>
          Selecciona el módulo que quieres utilizar en Digital Voting System.
        </Text>
      </View>

      <View style={styles.cards}>
        {showVoter ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Votante</Text>
            <Text style={styles.cardText}>
              Encuentra elecciones abiertas y emite tu voto.
            </Text>
            <PrimaryButton
              label="Ir a votaciones"
              onPress={() => router.push('/voter/elections')}
              variant="soft"
            />
          </View>
        ) : null}
        {showAdmin ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Administración de Elecciones</Text>
            <Text style={styles.cardText}>
              Gestiona elecciones, candidatos y estados.
            </Text>
            <PrimaryButton
              label="Administrar"
              onPress={() => router.push('/admin/elections')}
              variant="soft"
            />
          </View>
        ) : null}
        {showAdminLive ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resultados en vivo</Text>
            <Text style={styles.cardText}>
              Monitoreo del conteo en tiempo real por elección.
            </Text>
            <PrimaryButton
              label="Ver en vivo"
              onPress={() => router.push('/admin/results-live')}
              variant="soft"
            />
          </View>
        ) : null}
        {showResults ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resultados</Text>
            <Text style={styles.cardText}>
              Consulta el cierre de cada elección.
            </Text>
            <PrimaryButton
              label="Ver resultados"
              onPress={() => router.push('/results')}
              variant="soft"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Cerrar sesión" onPress={handleLogout} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    gap: 8,
  },
  title: {
    fontFamily: theme.fonts.heading,
    color: theme.colors.ink,
    fontSize: 26,
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
    fontSize: 14,
  },
  cards: {
    marginTop: 20,
    gap: 14,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.subheading,
    fontSize: 18,
  },
  cardText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 12,
  },
});
