import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { decodeJwtSubject, getToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type UserProfile = {
  id: string;
  fullName: string;
  email?: string | null;
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const userId = decodeJwtSubject(token);
        if (!userId) return;
        const data = await apiRequest<UserProfile>(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        setProfile(data);
        setFullName(data.fullName ?? '');
        setEmail(data.email ?? '');
      } catch (error) {
        const message =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: string }).message)
            : 'No se pudo cargar el perfil.';
        Alert.alert('Error', message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    if (!fullName.trim()) {
      Alert.alert('Datos incompletos', 'El nombre completo es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await apiRequest(`/users/${profile.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        json: {
          fullName: fullName.trim(),
          email: email.trim() || undefined,
        },
      });
      Alert.alert('Actualizado', 'Tu perfil se actualizó correctamente.');
      router.replace('/profile');
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo actualizar el perfil.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackButton label="Mi perfil" fallbackHref="/profile" />
      <View style={styles.header}>
        <Text style={styles.title}>Editar perfil</Text>
        <Text style={styles.subtitle}>Actualiza tu información.</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <InputField label="Nombre completo" value={fullName} onChangeText={setFullName} />
            <InputField label="Email" value={email} onChangeText={setEmail} />
          </View>
          <View style={styles.actions}>
            <PrimaryButton
              label={saving ? 'Guardando...' : 'Guardar cambios'}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
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
  content: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    marginTop: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  actions: {
    marginTop: 16,
  },
  loadingWrap: {
    marginTop: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 14,
  },
});
