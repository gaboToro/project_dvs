import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import type { Href } from 'expo-router';
import { io, Socket } from 'socket.io-client';

import { apiRequest } from '@/lib/api';
import { DASHBOARD_WS_URL } from '@/lib/config';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type MenuItem = {
  label: string;
  onPress: () => void;
};

type ElectionSummary = {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
};

type ElectionDetail = {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  candidates: { id: string; name: string }[];
};

type ResultResponse = {
  electionId: string;
  results: Record<string, number>;
  lastUpdatedAt?: string;
};

type LiveResultsPanelProps = {
  title: string;
  menuItems?: MenuItem[];
  showBack?: boolean;
  backLabel?: string;
  backHref?: Href;
  BackButton?: ComponentType<{ label: string; fallbackHref: Href; onPress?: () => void }>;
  onBackPress?: () => void;
};

const palette = [
  theme.colors.accent,
  theme.colors.success,
  '#4C7DEB',
  '#E95C4B',
  '#6D4BB8',
  '#F4B740',
  '#1F9CAD',
];

export function LiveResultsPanel({
  title,
  menuItems,
  showBack,
  backLabel = 'Volver',
  backHref = '/home',
  BackButton,
  onBackPress,
}: LiveResultsPanelProps) {
  const [elections, setElections] = useState<ElectionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [election, setElection] = useState<ElectionDetail | null>(null);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>(
    'connecting',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadElections = async () => {
      try {
        setErrorMessage(null);
        const data = await apiRequest<ElectionSummary[]>('/elections');
        if (!active) return;
        setElections(data ?? []);
        if (!selectedId && data?.length) {
          const open = data.find((item) => item.status === 'OPEN');
          setSelectedId(open?.id ?? data[0].id);
        }
      } catch (error) {
        if (!active) return;
        setErrorMessage(resolveErrorMessage(error, 'No se pudieron cargar las elecciones.'));
      }
    };
    loadElections();
    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const loadDetails = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [electionData, resultData] = await Promise.all([
          apiRequest<ElectionDetail>(`/elections/${selectedId}`),
          apiRequest<ResultResponse>(`/results/${selectedId}`),
        ]);
        if (!active) return;
        setElection(electionData);
        setResult(resultData);
      } catch (error) {
        if (!active) return;
        const status =
          typeof error === 'object' && error && 'status' in error
            ? (error as { status?: number }).status
            : undefined;
        if (status === 404) {
          setResult({ electionId: selectedId, results: {}, lastUpdatedAt: undefined });
        } else {
          setErrorMessage(resolveErrorMessage(error, 'No se pudo cargar los resultados.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDetails();
    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const socket: Socket = io(DASHBOARD_WS_URL, {
      transports: ['websocket'],
    });

    setWsStatus('connecting');

    const handleConnect = () => {
      setWsStatus('connected');
      socket.emit('subscribe', { electionId: selectedId });
    };

    const handleDisconnect = () => {
      setWsStatus('disconnected');
    };

    const handleUpdate = (payload: {
      electionId: string;
      results: Record<string, number>;
      lastUpdatedAt?: string | number | Date;
    }) => {
      if (payload?.electionId !== selectedId) return;
      const stamp = payload.lastUpdatedAt ? new Date(payload.lastUpdatedAt).toISOString() : undefined;
      setResult((prev) => ({
        electionId: payload.electionId,
        results: payload.results ?? {},
        lastUpdatedAt: stamp ?? prev?.lastUpdatedAt,
      }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);
    socket.on('results:update', handleUpdate);

    return () => {
      socket.emit('unsubscribe', { electionId: selectedId });
      socket.disconnect();
    };
  }, [selectedId]);

  const rows = useMemo(() => {
    const candidates = election?.candidates ?? [];
    const results = result?.results ?? {};
    return candidates
      .map((candidate, index) => ({
        id: candidate.id,
        name: candidate.name,
        count: results[candidate.id] ?? 0,
        color: palette[index % palette.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [election, result]);

  const maxCount = rows.reduce((max, row) => Math.max(max, row.count), 0);

  return (
    <View style={styles.wrapper}>
      {showBack && BackButton ? (
        <BackButton label={backLabel} fallbackHref={backHref} onPress={onBackPress} />
      ) : null}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {wsStatus === 'connected' ? 'Conectado en tiempo real' : 'Conectando...'}
          </Text>
        </View>
      </View>

      {menuItems?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menu}
        >
          {menuItems.map((item) => (
            <Pressable key={item.label} style={styles.menuItem} onPress={item.onPress}>
              <Text style={styles.menuText}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Elección</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.electionList}
        >
          {elections.map((item) => {
            const active = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedId(item.id)}
                style={[styles.electionPill, active && styles.electionPillActive]}
              >
                <Text style={[styles.electionName, active && styles.electionNameActive]}>
                  {item.title}
                </Text>
                <Text style={[styles.electionStatus, active && styles.electionStatusActive]}>
                  {item.status}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {elections.length === 0 ? (
          <Text style={styles.emptyText}>No hay elecciones disponibles.</Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando resultados...</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!loading ? (
        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Resultados</Text>
            {result?.lastUpdatedAt ? (
              <Text style={styles.updatedText}>
                Actualizado: {new Date(result.lastUpdatedAt).toLocaleString()}
              </Text>
            ) : null}
          </View>
          {rows.length === 0 ? (
            <Text style={styles.emptyText}>Aun no hay votos registrados.</Text>
          ) : (
            rows.map((row) => {
              const width: DimensionValue =
                maxCount > 0 ? `${Math.round((row.count / maxCount) * 100)}%` : 0;
              return (
                <View key={row.id} style={styles.row}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowTitle}>{row.name}</Text>
                    <Text style={styles.rowCount}>{row.count} votos</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width, backgroundColor: row.color }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
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
    marginTop: 4,
  },
  menu: {
    gap: 10,
    paddingVertical: 4,
  },
  menuItem: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.card,
  },
  menuText: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  electionList: {
    gap: 10,
    paddingVertical: 4,
  },
  electionPill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.card,
    minWidth: 140,
    gap: 6,
  },
  electionPillActive: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FFF9E6',
  },
  electionName: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 14,
  },
  electionNameActive: {
    color: theme.colors.accentDark,
  },
  electionStatus: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
  electionStatusActive: {
    color: theme.colors.accentDark,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E07A6A',
    backgroundColor: '#FCEBE8',
    padding: 12,
  },
  errorText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: 13,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  updatedText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
  row: {
    gap: 8,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 14,
  },
  rowCount: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.mist,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
  },
});
