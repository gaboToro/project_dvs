import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  createdAt?: number;
  updatedAt?: number;
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'voter'>('voter');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    getRole().then((currentRole) => {
      if (currentRole === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      const data = await apiRequest<User>(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
      setUsername(data.username ?? '');
      setFullName(data.fullName ?? '');
      setEmail(data.email ?? '');
      setRole(data.role);
      setEnabled(Boolean(data.enabled));
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo cargar el usuario.'));
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Datos incompletos', 'El nombre completo es obligatorio.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Datos incompletos', 'El usuario es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const nextPassword = password.trim();
      await apiRequest(`/users/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        json: {
          username: username.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          role,
          enabled,
          password: nextPassword ? nextPassword : undefined,
        },
      });
      Alert.alert('Actualizado', 'El usuario fue actualizado correctamente.');
      router.replace('/admin/users');
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo actualizar el usuario.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando usuario...</Text>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Usuario no disponible.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton label="Usuarios" fallbackHref="/admin/users" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{user.fullName}</Text>
          <Text style={styles.subtitle}>Usuario: {user.username}</Text>
        </View>

        <View style={styles.section}>
          <InputField label="Usuario" value={username} onChangeText={setUsername} />
          <InputField label="Nombre completo" value={fullName} onChangeText={setFullName} />
          <InputField label="Email" value={email} onChangeText={setEmail} />
          <InputField
            label="Nueva contraseña (opcional)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rol</Text>
          <View style={styles.optionRow}>
            <Pressable
              onPress={() => setRole('admin')}
              style={[styles.option, role === 'admin' && styles.optionActive]}
            >
              <Text style={[styles.optionText, role === 'admin' && styles.optionTextActive]}>
                Administrador
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole('voter')}
              style={[styles.option, role === 'voter' && styles.optionActive]}
            >
              <Text style={[styles.optionText, role === 'voter' && styles.optionTextActive]}>
                Votante
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.optionRow}>
            <Pressable
              onPress={() => setEnabled(true)}
              style={[styles.option, enabled && styles.optionActive]}
            >
              <Text style={[styles.optionText, enabled && styles.optionTextActive]}>
                Activo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEnabled(false)}
              style={[styles.option, !enabled && styles.optionActive]}
            >
              <Text style={[styles.optionText, !enabled && styles.optionTextActive]}>
                Inactivo
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={saving ? 'Guardando...' : 'Guardar cambios'}
            onPress={handleSave}
            disabled={saving}
          />
          <PrimaryButton label="Cancelar" variant="ghost" onPress={() => router.back()} />
        </View>
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
  header: {
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
    gap: 12,
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
    gap: 10,
  },
  option: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  optionActive: {
    borderColor: theme.colors.success,
    backgroundColor: '#E7F6F1',
  },
  optionText: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.slate,
    fontSize: 13,
  },
  optionTextActive: {
    color: theme.colors.success,
  },
  actions: {
    gap: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
  },
});
