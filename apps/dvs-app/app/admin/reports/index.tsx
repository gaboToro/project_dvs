import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';
import { getRole } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type StatusFilter = 'ALL' | 'DRAFT' | 'OPEN' | 'CLOSED';

type Election = {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
};

export default function ReportsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  const statusQuery = useMemo(() => {
    if (status === 'ALL') return '';
    return `?status=${status}`;
  }, [status]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await apiRequest<Election[]>(`/elections${statusQuery}`);
        if (!active) return;
        setElections(data ?? []);
      } catch (error) {
        if (!active) return;
        setErrorMessage(resolveErrorMessage(error, 'No se pudieron cargar las elecciones.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [statusQuery]);

  const handleDownloadCsv = () => {
    const url = `${API_BASE_URL}/reports/elections.csv${statusQuery}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
      return;
    }
    Alert.alert('Descarga', `Copia este enlace en el navegador:\n${url}`);
  };

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" onPress={() => router.replace('/home')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Reportes</Text>
          <Text style={styles.subtitle}>Genera y descarga reportes.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de elecciones</Text>
          <View style={styles.optionRow}>
            {(['ALL', 'DRAFT', 'OPEN', 'CLOSED'] as StatusFilter[]).map((value) => (
              <PrimaryButton
                key={value}
                label={value === 'ALL' ? 'Todos' : value}
                variant={status === value ? 'soft' : 'ghost'}
                onPress={() => setStatus(value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descarga directa</Text>
          <PrimaryButton label="Descargar CSV" variant="soft" onPress={handleDownloadCsv} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elecciones</Text>
          {loading ? (
            <Text style={styles.helperText}>Cargando elecciones...</Text>
          ) : errorMessage ? (
            <Text style={styles.helperText}>{errorMessage}</Text>
          ) : elections.length === 0 ? (
            <Text style={styles.helperText}>No hay elecciones para este estado.</Text>
          ) : (
            elections.map((election) => (
              <View key={election.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{election.title}</Text>
                  <Text style={styles.cardMeta}>{election.status}</Text>
                </View>
                <Text style={styles.cardText}>
                  {election.description ?? 'Sin descripción registrada.'}
                </Text>
                <Text style={styles.cardMeta}>
                  {new Date(election.startsAt).toLocaleString()} -{' '}
                  {new Date(election.endsAt).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
    gap: 6,
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
  section: {
    marginTop: 16,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  helperText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
  },
  card: {
    marginTop: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.subheading,
    fontSize: 16,
  },
  cardText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  cardMeta: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
});
