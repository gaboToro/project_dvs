import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { getRole } from '@/lib/auth';
import { theme } from '@/lib/theme';

export default function ConfirmScreen() {
  const { electionId } = useLocalSearchParams<{ electionId: string }>();
  const router = useRouter();

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'admin') {
        Alert.alert('Acceso denegado', 'Solo los votantes pueden acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  return (
    <Screen contentStyle={styles.content}>
      <BackButton label="Inicio" fallbackHref="/home" />
      <View style={styles.card}>
        <Text style={styles.kicker}>Voto registrado</Text>
        <Text style={styles.title}>Gracias por participar</Text>
        <Text style={styles.text}>
          Tu voto para la eleccion {electionId} fue procesado correctamente.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="Volver a elecciones"
          onPress={() => router.replace('/voter/elections')}
          variant="soft"
        />
        <PrimaryButton
          label="Inicio"
          variant="ghost"
          onPress={() => router.replace('/home')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: 24,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  kicker: {
    color: theme.colors.success,
    fontFamily: theme.fonts.subheading,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
  },
  text: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
