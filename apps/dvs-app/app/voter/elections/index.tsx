import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type Election = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
};

export default function ElectionsScreen() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'admin') {
        Alert.alert('Acceso denegado', 'Solo los votantes pueden votar.');
        router.replace('/home');
      }
    });
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await apiRequest<Election[]>('/elections?status=OPEN', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setElections(data ?? []);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo cargar las elecciones.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" />
      <View style={styles.header}>
        <Text style={styles.title}>Elecciones abiertas</Text>
        <Text style={styles.subtitle}>Selecciona una eleccion para votar.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {elections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin elecciones activas</Text>
            <Text style={styles.emptyText}>
              Vuelve mas tarde o consulta con el administrador.
            </Text>
          </View>
        ) : (
          elections.map((election) => (
            <View key={election.id} style={styles.card}>
              <Text style={styles.cardTitle}>{election.title}</Text>
              {election.description ? (
                <Text style={styles.cardText}>{election.description}</Text>
              ) : null}
              <Text style={styles.cardMeta}>
                Abierta hasta {new Date(election.endsAt).toLocaleString()}
              </Text>
              <PrimaryButton
                label="Emitir voto"
                onPress={() => router.push(`/voter/elections/${election.id}`)}
                variant="soft"
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
    gap: 8,
  },
  title: {
    fontFamily: theme.fonts.heading,
    color: theme.colors.ink,
    fontSize: 26,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 14,
  },
  list: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 10,
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
    fontSize: 14,
    lineHeight: 20,
  },
  cardMeta: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    padding: 24,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 14,
  },
});
