import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type Election = {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
};

export default function ResultsIndexScreen() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'admin') {
        Alert.alert('Acceso denegado', 'Solo los votantes pueden ver resultados.');
        router.replace('/home');
      }
    });
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Election[]>('/elections?status=CLOSED');
      setElections(data ?? []);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudieron cargar las elecciones cerradas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return elections;
    return elections.filter((election) =>
      election.title.toLowerCase().includes(q),
    );
  }, [elections, query]);

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" />
      <View style={styles.header}>
        <Text style={styles.title}>Resultados</Text>
        <Text style={styles.subtitle}>Consulta el cierre de cada eleccion.</Text>
      </View>

      <View style={styles.search}>
        <InputField
          label="Buscar por nombre"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {filtered.map((election) => (
          <View key={election.id} style={styles.card}>
            <Text style={styles.cardTitle}>{election.title}</Text>
            {election.description ? (
              <Text style={styles.cardText}>{election.description}</Text>
            ) : null}
            <PrimaryButton
              label="Ver detalle"
              onPress={() => router.push(`/results/${election.id}`)}
              variant="soft"
            />
          </View>
        ))}
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No hay coincidencias.</Text>
        ) : null}
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
  search: {
    marginTop: 20,
    gap: 12,
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
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
});
