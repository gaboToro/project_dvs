import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { INTERNAL_SERVICE_TOKEN } from '@/lib/config';
import { getRole } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type BackupArtifact = {
  name: string;
  path: string;
};

type BackupResult = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  artifacts: BackupArtifact[];
  message?: string;
};

export default function BackupScreen() {
  const router = useRouter();
  const [lastResult, setLastResult] = useState<BackupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<BackupResult | null>('/backup/last');
      setLastResult(data ?? null);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo cargar el respaldo.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runBackup = async () => {
    if (!INTERNAL_SERVICE_TOKEN) {
      Alert.alert(
        'Falta configuracion',
        'Define EXPO_PUBLIC_INTERNAL_SERVICE_TOKEN para ejecutar respaldos.'
      );
      return;
    }

    setRunning(true);
    try {
      const result = await apiRequest<BackupResult>('/backup/run', {
        method: 'POST',
        headers: { 'x-internal-token': INTERNAL_SERVICE_TOKEN },
        json: { reason: 'manual' },
      });
      setLastResult(result ?? null);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo ejecutar el respaldo.'));
    } finally {
      setRunning(false);
    }
  };

  const lastLabel = lastResult
    ? `${new Date(lastResult.startedAt).toLocaleString()} - ${
        new Date(lastResult.finishedAt).toLocaleString()
      }`
    : 'Sin respaldos registrados.';

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" onPress={() => router.replace('/home')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Respaldos</Text>
          <Text style={styles.subtitle}>Ejecuta y revisa respaldos del sistema.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ultimo respaldo</Text>
          <Text style={styles.cardText}>{lastLabel}</Text>
          {lastResult ? (
            <Text style={[styles.cardMeta, lastResult.ok ? styles.ok : styles.down]}>
              {lastResult.ok ? 'OK' : lastResult.message ?? 'Error'}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones</Text>
          <PrimaryButton
            label={running ? 'Ejecutando...' : 'Ejecutar respaldo'}
            variant="soft"
            onPress={runBackup}
            disabled={running}
          />
          {!INTERNAL_SERVICE_TOKEN ? (
            <Text style={styles.cardMeta}>
              Configura EXPO_PUBLIC_INTERNAL_SERVICE_TOKEN para habilitar el boton.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Archivos generados</Text>
          {lastResult?.artifacts?.length ? (
            lastResult.artifacts.map((artifact) => (
              <View key={`${artifact.name}-${artifact.path}`} style={styles.artifactRow}>
                <Text style={styles.artifactName}>{artifact.name}</Text>
                <Text style={styles.artifactPath}>{artifact.path}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardMeta}>No hay archivos registrados.</Text>
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
  card: {
    marginTop: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  cardText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
  },
  cardMeta: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
  ok: {
    color: theme.colors.accent,
  },
  down: {
    color: theme.colors.danger,
  },
  artifactRow: {
    gap: 4,
  },
  artifactName: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 12,
  },
  artifactPath: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
});
