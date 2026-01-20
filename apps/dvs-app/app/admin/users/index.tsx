import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type User = {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  role: 'admin' | 'voter';
  enabled: boolean;
};

export default function UsersAdminScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

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
      if (!token) {
        router.replace('/login');
        return;
      }
      const data = await apiRequest<User[]>('/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data ?? []);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudieron cargar los usuarios.'));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(needle) ||
        user.fullName.toLowerCase().includes(needle) ||
        (user.email ?? '').toLowerCase().includes(needle)
      );
    });
  }, [query, users]);

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" onPress={() => router.replace('/home')} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Usuarios</Text>
          <Text style={styles.subtitle}>Administra cuentas, roles y acceso.</Text>
        </View>
        <PrimaryButton label="Nuevo usuario" onPress={() => router.push('/admin/users/new')} />
      </View>

      <View style={styles.search}>
        <InputField label="Buscar" value={query} onChangeText={setQuery} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              No hay usuarios que coincidan con la búsqueda.
            </Text>
          </View>
        ) : (
          filtered.map((user) => (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardTitle}>{user.fullName}</Text>
                  <Text style={styles.cardMeta}>Usuario: {user.username}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {user.role === 'admin' ? 'Admin' : 'Votante'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardText}>
                {user.email ? user.email : 'Sin email registrado.'}
              </Text>
              <Text style={styles.cardMeta}>
                Estado: {user.enabled ? 'Activo' : 'Inactivo'}
              </Text>
              <View style={styles.actions}>
                <PrimaryButton
                  label="Ver detalle"
                  variant="soft"
                  onPress={() => router.push(`/admin/users/${user.id}`)}
                />
              </View>
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
  search: {
    marginTop: 16,
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
    gap: 12,
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
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
  },
  badgeText: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  actions: {
    gap: 10,
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
