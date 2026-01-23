import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type RoleOption = 'admin' | 'voter';

export default function NewUserScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleOption>('voter');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getRole().then((currentRole) => {
      if (currentRole === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  const handleCreate = async () => {
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      Alert.alert('Datos incompletos', 'Completa usuario, nombre y contraseña.');
      return;
    }
    const token = await getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        json: {
          username: username.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          role,
          enabled,
          password: password.trim(),
        },
      });
      Alert.alert('Creado', 'El usuario fue creado correctamente.');
      router.replace('/admin/users');
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo crear el usuario.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackButton label="Usuarios" fallbackHref="/admin/users" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo usuario</Text>
          <Text style={styles.subtitle}>Configura accesos y rol.</Text>
        </View>

        <View style={styles.form}>
          <InputField label="Usuario" value={username} onChangeText={setUsername} />
          <InputField label="Nombre completo" value={fullName} onChangeText={setFullName} />
          <InputField label="Email" value={email} onChangeText={setEmail} />
          <InputField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
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
            label={saving ? 'Guardando...' : 'Crear usuario'}
            onPress={handleCreate}
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
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
  form: {
    marginTop: 20,
    gap: 14,
  },
  section: {
    marginTop: 20,
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
    color: theme.colors.accentDark,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
});
