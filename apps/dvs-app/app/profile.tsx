import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { decodeJwtSubject, getToken } from '@/lib/auth';
import { theme } from '@/lib/theme';

type UserProfile = {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  role: 'admin' | 'voter';
  enabled: boolean;
  createdAt?: number;
  updatedAt?: number;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" />
      <View style={styles.header}>
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>Datos de tu cuenta.</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      ) : profile ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre completo</Text>
              <Text style={styles.value}>{profile.fullName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>
                {profile.email ? profile.email : 'Sin email registrado'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Usuario</Text>
              <Text style={styles.value}>{profile.username}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Rol</Text>
              <Text style={styles.value}>
                {profile.role === 'admin' ? 'Administrador' : 'Votante'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado</Text>
              <Text style={styles.value}>
                {profile.enabled ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <PrimaryButton label="Editar perfil" onPress={() => router.push('/profile/edit')} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Perfil no disponible.</Text>
        </View>
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
  row: {
    gap: 4,
  },
  label: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: 15,
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
