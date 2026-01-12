import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type ResultResponse = {
  electionId: string;
  results: Record<string, number>;
  lastUpdatedAt?: string;
};

type Election = {
  id: string;
  title: string;
  candidates: { id: string; name: string }[];
};

export default function AdminResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  useEffect(() => {
    const load = async () => {
      try {
        const [resultData, electionData] = await Promise.all([
          apiRequest<ResultResponse>(`/results/${id}`),
          apiRequest<Election>(`/elections/${id}`),
        ]);
        setResult(resultData);
        setElection(electionData);
      } catch (error) {
        Alert.alert('Error', resolveErrorMessage(error, 'No se pudo cargar los resultados.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando resultados...</Text>
        </View>
      </Screen>
    );
  }

  if (!result) {
    return (
      <Screen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Sin resultados disponibles.</Text>
          <PrimaryButton label="Volver" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const candidateMap = new Map(
    election?.candidates?.map((candidate) => [candidate.id, candidate.name]) ?? [],
  );

  const rows = Object.entries(result.results ?? {})
    .map(([candidateId, count]) => ({
      candidateId,
      count,
      name: candidateMap.get(candidateId) ?? candidateId,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Screen>
      <BackButton label="Elecciones" fallbackHref="/admin/elections" />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.title}>{election?.title ?? result.electionId}</Text>
          {result.lastUpdatedAt ? (
            <Text style={styles.subtitle}>
              Actualizado: {new Date(result.lastUpdatedAt).toLocaleString()}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          {rows.length === 0 ? (
            <Text style={styles.emptyText}>Aun no hay votos registrados.</Text>
          ) : (
            rows.map((row) => (
              <View key={row.candidateId} style={styles.card}>
                <Text style={styles.cardTitle}>{row.name}</Text>
                <Text style={styles.cardCount}>{row.count} votos</Text>
              </View>
            ))
          )}
        </View>

        <PrimaryButton label="Volver" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  title: {
    fontFamily: theme.fonts.heading,
    color: theme.colors.ink,
    fontSize: 26,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
    marginTop: 6,
  },
  section: {
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  cardCount: {
    fontFamily: theme.fonts.body,
    color: theme.colors.accentDark,
    fontSize: 14,
  },
  emptyText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 14,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
  },
});
