import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { BackButton } from '@/components/BackButton';
import { DateTimeField } from '@/components/DateTimeField';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type AuditLog = {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

function parseMetadata(metadata: AuditLog['metadata']): Record<string, unknown> | null {
  if (!metadata) return null;
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof metadata === 'object') return metadata as Record<string, unknown>;
  return null;
}

export default function AuditLogScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<Record<string, { fullName: string; username: string }>>({});
  const [searchName, setSearchName] = useState('');
  const [elections, setElections] = useState<{ id: string; title: string }[]>([]);
  const [electionId, setElectionId] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [resource, setResource] = useState('ALL');
  const [actorRole, setActorRole] = useState('ALL');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [limit, setLimit] = useState('1000');

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
    const loadUsers = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiRequest<
          { id: string; fullName: string; username: string }[]
        >('/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        const nextMap: Record<string, { fullName: string; username: string }> = {};
        (data ?? []).forEach((user) => {
          if (user.id) {
            nextMap[user.id] = {
              fullName: user.fullName ?? '',
              username: user.username ?? '',
            };
          }
        });
        setUserMap(nextMap);
      } catch {
        if (active) setUserMap({});
      }
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadElections = async () => {
      try {
        const data = await apiRequest<{ id: string; title: string }[]>('/elections');
        if (!active) return;
        setElections(data ?? []);
      } catch {
        if (active) setElections([]);
      }
    };
    loadElections();
    return () => {
      active = false;
    };
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (action !== 'ALL') params.set('action', action);
    if (resource !== 'ALL') params.set('resource', resource);
    if (actorRole !== 'ALL') params.set('actorRole', actorRole);
    if (electionId !== 'ALL') params.set('electionId', electionId);
    if (from) params.set('from', from.toISOString());
    if (to) params.set('to', to.toISOString());
    const limitValue = Number(limit);
    if (Number.isFinite(limitValue) && limitValue > 0) {
      params.set('limit', String(limitValue));
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  }, [action, resource, actorRole, electionId, from, to, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AuditLog[]>(`/audit${queryString}`);
      setLogs(data ?? []);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudieron cargar los logs.'));
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  const actionOptions = useMemo(() => {
    const values = new Set<string>();
    logs.forEach((entry) => values.add(entry.action));
    return ['ALL', ...Array.from(values)];
  }, [logs]);

  const resourceOptions = useMemo(() => {
    const values = new Set<string>();
    logs.forEach((entry) => values.add(entry.resource));
    return ['ALL', ...Array.from(values)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const needle = searchName.trim().toLowerCase();
    let result = logs;
    if (electionId !== 'ALL') {
      result = result.filter((entry) => {
        const meta = parseMetadata(entry.metadata) as { electionId?: string } | null;
        return meta?.electionId === electionId;
      });
    }
    if (!needle) return result;
    return result.filter((entry) => {
      if (!entry.actorId) return false;
      const user = userMap[entry.actorId];
      const fullName = user?.fullName ?? '';
      const username = user?.username ?? '';
      return (
        fullName.toLowerCase().includes(needle) ||
        username.toLowerCase().includes(needle)
      );
    });
  }, [logs, searchName, userMap, electionId]);

  const participantNames = useMemo(() => {
    if (electionId === 'ALL') return [];
    const names = new Set<string>();
    filteredLogs.forEach((entry) => {
      if (entry.resource !== 'votes' && !entry.action.startsWith('VOTE')) return;
      if (!entry.actorId) return;
      const user = userMap[entry.actorId];
      const label = user?.fullName || user?.username;
      if (label) names.add(label);
    });
    return Array.from(names);
  }, [filteredLogs, electionId, userMap]);

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" onPress={() => router.replace('/home')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Auditoria</Text>
          <Text style={styles.subtitle}>Revisa la actividad del sistema.</Text>
        </View>

        <View style={styles.filters}>
          <InputField
            label="Buscar por nombre o usuario"
            value={searchName}
            onChangeText={setSearchName}
          />
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Eleccion</Text>
              <View style={styles.pickerShell}>
                <Picker selectedValue={electionId} onValueChange={setElectionId} style={styles.picker}>
                  <Picker.Item label="Todas" value="ALL" />
                  {elections.map((election) => (
                    <Picker.Item key={election.id} label={election.title} value={election.id} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Rol</Text>
              <View style={styles.pickerShell}>
                <Picker selectedValue={actorRole} onValueChange={setActorRole} style={styles.picker}>
                  <Picker.Item label="Todos" value="ALL" />
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Votante" value="voter" />
                  <Picker.Item label="Sistema" value="system" />
                </Picker>
              </View>
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Accion</Text>
              <View style={styles.pickerShell}>
                <Picker selectedValue={action} onValueChange={setAction} style={styles.picker}>
                  {actionOptions.map((value) => (
                    <Picker.Item key={value} label={value === 'ALL' ? 'Todas' : value} value={value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Recurso</Text>
              <View style={styles.pickerShell}>
                <Picker selectedValue={resource} onValueChange={setResource} style={styles.picker}>
                  {resourceOptions.map((value) => (
                    <Picker.Item key={value} label={value === 'ALL' ? 'Todos' : value} value={value} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Limite</Text>
              <View style={styles.pickerShell}>
                <Picker selectedValue={limit} onValueChange={setLimit} style={styles.picker}>
                  {['100', '200', '500', '1000'].map((value) => (
                    <Picker.Item key={value} label={value} value={value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <DateTimeField label="Desde" value={from} onChange={setFrom} />
            </View>
            <View style={styles.filterField}>
              <DateTimeField label="Hasta" value={to} onChange={setTo} />
            </View>
          </View>

        </View>

        <View style={styles.list}>
          {electionId !== 'ALL' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Participantes</Text>
              {participantNames.length === 0 ? (
                <Text style={styles.cardText}>
                  No hay votantes registrados para esta eleccion.
                </Text>
              ) : (
                <Text style={styles.cardText}>
                  {participantNames.join(', ')}
                </Text>
              )}
            </View>
          ) : null}
          {filteredLogs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sin registros</Text>
              <Text style={styles.emptyText}>No hay logs con los filtros actuales.</Text>
            </View>
          ) : (
            filteredLogs.map((entry) => {
              const actorInfo = entry.actorId ? userMap[entry.actorId] : null;
              const hideMetadata =
                entry.resource === 'votes' || entry.action.startsWith('VOTE');
              const meta = parseMetadata(entry.metadata) as { electionId?: string } | null;
              const electionTitle = meta?.electionId
                ? elections.find((election) => election.id === meta.electionId)?.title
                : undefined;
              const actorLabel =
                actorInfo?.fullName || actorInfo?.username || entry.actorRole || 'system';
              return (
                <View key={entry.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{entry.action}</Text>
                    <Text style={styles.cardMeta}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.cardText}>
                    {entry.resource}
                    {entry.resourceId ? ` - ${entry.resourceId}` : ''}
                  </Text>
                  {electionTitle ? (
                    <Text style={styles.cardMeta}>Eleccion: {electionTitle}</Text>
                  ) : null}
                  <Text style={styles.cardMeta}>
                    Actor: {actorLabel}
                  </Text>
                  {entry.ip ? <Text style={styles.cardMeta}>IP: {entry.ip}</Text> : null}
                  {entry.metadata && !hideMetadata ? (
                    <Text style={styles.cardMeta}>
                      Metadata: {JSON.stringify(entry.metadata)}
                    </Text>
                  ) : null}
                </View>
              );
            })
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
  filters: {
    marginTop: 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterField: {
    flex: 1,
    minWidth: 160,
    gap: 6,
  },
  filterLabel: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  picker: {
    height: 44,
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
