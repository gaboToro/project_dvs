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
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
};

export default function ElectionsAdminScreen() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
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
    try {
      const token = await getToken();
      const data = await apiRequest<Election[]>('/elections', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setElections(data ?? []);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudieron cargar las elecciones.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (election: Election) => {
    Alert.alert(
      'Confirmar eliminacion',
      `¿Esta seguro de eliminar la votacion "${election.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                router.replace('/login');
                return;
              }
              await apiRequest(`/elections/${election.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Eliminado', 'La votacion se elimino correctamente.');
              await load();
            } catch (error) {
              Alert.alert('Error', resolveErrorMessage(error, 'No se pudo eliminar la votacion.'));
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" onPress={() => router.replace('/home')} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Elecciones</Text>
          <Text style={styles.subtitle}>Crea, abre o cierra procesos.</Text>
        </View>
        <PrimaryButton label="Nueva elección" onPress={() => router.push('/admin/elections/new')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {elections.map((election) => (
          <View key={election.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{election.title}</Text>
              <Text style={styles.status}>{election.status}</Text>
            </View>
            <Text style={styles.cardText}>
              {election.description ?? 'Sin descripción registrada.'}
            </Text>
            <Text style={styles.cardMeta}>
              {new Date(election.startsAt).toLocaleString()} -{' '}
              {new Date(election.endsAt).toLocaleString()}
            </Text>
            {election.status === 'CLOSED' ? (
              <View style={styles.actions}>
                <PrimaryButton
                  label="Resultados"
                  onPress={() => router.push(`/admin/elections/${election.id}/results`)}
                  variant="soft"
                />
              </View>
            ) : (
              <View style={styles.actions}>
                <PrimaryButton
                  label="Gestionar"
                  onPress={() => router.push(`/admin/elections/${election.id}`)}
                  variant="soft"
                />
                <PrimaryButton
                  label="Eliminar"
                  onPress={() => handleDelete(election)}
                  variant="ghost"
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.subheading,
    fontSize: 18,
  },
  status: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 12,
    letterSpacing: 1,
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
  actions: {
    gap: 10,
  },
});
