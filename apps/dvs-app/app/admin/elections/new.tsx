import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { DateTimeField } from '@/components/DateTimeField';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

export default function NewElectionScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const startsAt = useMemo(
    () => (startDateTime ? startDateTime.toISOString() : ''),
    [startDateTime],
  );
  const endsAt = useMemo(
    () => (endDateTime ? endDateTime.toISOString() : ''),
    [endDateTime],
  );

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  const handleCreate = async () => {
    if (!title || !startsAt || !endsAt) {
      Alert.alert('Datos incompletos', 'Completa titulo, fecha y hora.');
      return;
    }
    if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      Alert.alert('Fechas invalidas', 'La apertura debe ser antes del cierre.');
      return;
    }
    const token = await getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    try {
      await apiRequest('/elections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        json: {
          title,
          description: description || undefined,
          startsAt,
          endsAt,
        },
      });
      Alert.alert('Creada', 'La votacion se creo correctamente.');
      router.replace('/admin/elections');
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo crear la eleccion.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <BackButton label="Elecciones" fallbackHref="/admin/elections" />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.title}>Nueva eleccion</Text>
          <Text style={styles.subtitle}>
            Define fecha y hora de apertura y cierre.
          </Text>
        </View>

        <View style={styles.form}>
          <InputField label="Titulo" value={title} onChangeText={setTitle} />
          <InputField
            label="Descripcion"
            value={description}
            onChangeText={setDescription}
          />
          <DateTimeField
            label="Apertura"
            value={startDateTime}
            onChange={setStartDateTime}
          />
          <DateTimeField
            label="Cierre"
            value={endDateTime}
            onChange={setEndDateTime}
          />
          {startDateTime && endDateTime ? (
            <Text style={styles.helper}>
              Apertura: {startDateTime.toLocaleString()} | Cierre:{' '}
              {endDateTime.toLocaleString()}
            </Text>
          ) : null}
        </View>

        <PrimaryButton
          label={loading ? 'Guardando...' : 'Crear eleccion'}
          onPress={handleCreate}
          disabled={loading}
        />
        <PrimaryButton
          label="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
        />
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
  title: {
    fontFamily: theme.fonts.heading,
    color: theme.colors.ink,
    fontSize: 26,
  },
  subtitle: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  helper: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
});
