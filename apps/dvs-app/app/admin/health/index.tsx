import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { API_BASE_URL } from '@/lib/config';
import { getRole } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type ServiceDef = {
  key: string;
  label: string;
  path: string;
};

type ServiceStatus = ServiceDef & {
  ok: boolean;
  detail?: string;
};

const services: ServiceDef[] = [
  { key: 'gateway', label: 'API Gateway', path: '/health' },
  { key: 'auth', label: 'Auth Service', path: '/auth/health' },
  { key: 'users', label: 'User Service', path: '/users/health' },
  { key: 'elections', label: 'Election Service', path: '/elections/health' },
  { key: 'votes', label: 'Voting Service', path: '/votes/health' },
  { key: 'results', label: 'Results Service', path: '/results/health' },
  { key: 'dashboard', label: 'Dashboard Service', path: '/dashboard/health' },
  { key: 'audit', label: 'Audit Log Service', path: '/audit/health' },
  { key: 'reporting', label: 'Reporting Service', path: '/reports/health' },
  { key: 'ratelimit', label: 'Rate Limiter Service', path: '/ratelimit/health' },
  { key: 'backup', label: 'Scheduler Backup Service', path: '/backup/health' },
  { key: 'email', label: 'Email Notifier Service', path: '/email/health' },
  { key: 'blockchain', label: 'Blockchain Service', path: '/chain/verify' },
];

async function checkService(service: ServiceDef): Promise<ServiceStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}${service.path}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const payload = await res.json().catch(() => null);
    const ok =
      payload?.status === 'ok' ||
      payload?.ok === true ||
      payload?.valid === true ||
      res.ok;
    const detail =
      typeof payload?.service === 'string'
        ? payload.service
        : payload?.valid === false
          ? 'invalid chain'
          : undefined;
    return { ...service, ok, detail };
  } catch (error) {
    return {
      ...service,
      ok: false,
      detail: resolveErrorMessage(error, 'down'),
    };
  }
}

export default function HealthScreen() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

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
    const results = await Promise.all(services.map((service) => checkService(service)));
    setStatuses(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const overall = useMemo(() => statuses.every((entry) => entry.ok), [statuses]);

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" onPress={() => router.replace('/home')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Monitoreo</Text>
          <Text style={styles.subtitle}>Estado de los microservicios.</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Estado general</Text>
          <Text style={[styles.summaryValue, overall ? styles.ok : styles.down]}>
            {overall ? 'OK' : 'Atención'}
          </Text>
          <PrimaryButton label="Actualizar" variant="soft" onPress={load} />
        </View>

        <View style={styles.list}>
          {statuses.map((entry) => (
            <View key={entry.key} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{entry.label}</Text>
                <View style={[styles.badge, entry.ok ? styles.badgeOk : styles.badgeDown]}>
                  <Text style={styles.badgeText}>{entry.ok ? 'OK' : 'DOWN'}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{entry.path}</Text>
              {entry.detail ? <Text style={styles.cardMeta}>{entry.detail}</Text> : null}
            </View>
          ))}
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
  summaryCard: {
    marginTop: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  summaryTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  summaryValue: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
  },
  ok: {
    color: theme.colors.accent,
  },
  down: {
    color: theme.colors.danger,
  },
  list: {
    paddingTop: 20,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  cardMeta: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOk: {
    backgroundColor: 'rgba(44, 191, 124, 0.2)',
  },
  badgeDown: {
    backgroundColor: 'rgba(220, 71, 71, 0.2)',
  },
  badgeText: {
    fontFamily: theme.fonts.subheading,
    fontSize: 11,
    color: theme.colors.ink,
  },
});
