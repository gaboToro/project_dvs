import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { clearToken, getRole } from '@/lib/auth';
import { theme } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'voter' | null>(null);

  useEffect(() => {
    getRole().then((stored) => setRole(stored as 'admin' | 'voter' | null));
  }, []);

  const showAdmin = useMemo(() => role === 'admin', [role]);
  const showVoter = useMemo(() => role === 'voter', [role]);
  const showResults = useMemo(() => role === 'voter', [role]);

  const handleLogout = async () => {
    await clearToken();
    router.replace('/login');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Panel principal</Text>
        <Text style={styles.subtitle}>
          Selecciona el modulo que quieres utilizar en esta demo.
        </Text>
      </View>

      <View style={styles.cards}>
        {showVoter ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Votante</Text>
            <Text style={styles.cardText}>
              Encuentra elecciones abiertas y emite tu voto.
            </Text>
            <PrimaryButton
              label="Ir a votaciones"
              onPress={() => router.push('/voter/elections')}
              variant="soft"
            />
          </View>
        ) : null}
        {showAdmin ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Administracion</Text>
            <Text style={styles.cardText}>
              Gestiona elecciones, candidatos y estados.
            </Text>
            <PrimaryButton
              label="Ir a admin"
              onPress={() => router.push('/admin/elections')}
              variant="soft"
            />
          </View>
        ) : null}
        {showResults ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resultados</Text>
            <Text style={styles.cardText}>
              Consulta el cierre de cada eleccion.
            </Text>
            <PrimaryButton
              label="Ver resultados"
              onPress={() => router.push('/results')}
              variant="soft"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Cerrar sesion" onPress={handleLogout} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
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
  cards: {
    marginTop: 20,
    gap: 14,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.subheading,
    fontSize: 18,
  },
  cardText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 12,
  },
});
