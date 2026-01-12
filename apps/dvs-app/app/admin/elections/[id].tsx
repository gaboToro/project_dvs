import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { DateTimeField } from '@/components/DateTimeField';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type Candidate = {
  id: string;
  name: string;
  plan?: string | null;
  photoUrl?: string | null;
};

type Election = {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
  candidates: Candidate[];
};

export default function ElectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [baselineTitle, setBaselineTitle] = useState('');
  const [baselineDescription, setBaselineDescription] = useState('');
  const [baselineStartsAt, setBaselineStartsAt] = useState<number | null>(null);
  const [baselineEndsAt, setBaselineEndsAt] = useState<number | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidatePlan, setCandidatePlan] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('');

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'voter') {
        Alert.alert('Acceso denegado', 'Solo el administrador puede acceder.');
        router.replace('/home');
      }
    });
  }, [router]);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<Election>(`/elections/${id}`);
      setElection(data);
      setTitle(data.title ?? '');
      setDescription(data.description ?? '');
      setStartsAt(data.startsAt ? new Date(data.startsAt) : null);
      setEndsAt(data.endsAt ? new Date(data.endsAt) : null);
      setBaselineTitle(data.title ?? '');
      setBaselineDescription(data.description ?? '');
      setBaselineStartsAt(data.startsAt ? new Date(data.startsAt).getTime() : null);
      setBaselineEndsAt(data.endsAt ? new Date(data.endsAt).getTime() : null);
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message)
          : 'No se pudo cargar la eleccion.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const withToken = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/login');
      return null;
    }
    return token;
  };

  const handleAddCandidate = async () => {
    if (!candidateName) {
      Alert.alert('Faltan datos', 'Ingresa el nombre del candidato.');
      return;
    }
    const token = await withToken();
    if (!token) return;
    try {
      await apiRequest(`/elections/${id}/candidates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        json: {
          name: candidateName,
          plan: candidatePlan || undefined,
        },
      });
      Alert.alert('Candidato agregado', 'El candidato fue agregado correctamente.');
      setCandidateName('');
      setCandidatePlan('');
      await load();
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo agregar el candidato.'));
    }
  };

  const handleRemoveCandidate = async (candidateId: string) => {
    const confirmMessage =
      '¿Estas seguro que deseas eliminar este candidato? Esta accion es irreversible.';
    const confirmed =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.confirm(confirmMessage)
        : true;

    if (!confirmed) return;

    if (Platform.OS !== 'web') {
      Alert.alert('Confirmar eliminacion', confirmMessage, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const token = await withToken();
            if (!token) return;
            try {
              await apiRequest(`/elections/${id}/candidates/${candidateId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Candidato eliminado', 'El candidato fue eliminado correctamente.');
              await load();
            } catch (error) {
              Alert.alert('Error', resolveErrorMessage(error, 'No se pudo eliminar el candidato.'));
            }
          },
        },
      ]);
      return;
    }

    const token = await withToken();
    if (!token) return;
    try {
      await apiRequest(`/elections/${id}/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert('El candidato fue eliminado correctamente.');
      await load();
    } catch (error) {
      window.alert(resolveErrorMessage(error, 'No se pudo eliminar el candidato.'));
    }
  };

  const handleSaveElection = async () => {
    if (!election) return;
    if (!title.trim()) {
      Alert.alert('Datos incompletos', 'El titulo es obligatorio.');
      return;
    }
    if (!startsAt || !endsAt) {
      Alert.alert('Datos incompletos', 'Define la fecha y hora de apertura y cierre.');
      return;
    }
    if (startsAt.getTime() >= endsAt.getTime()) {
      Alert.alert('Fechas invalidas', 'La apertura debe ser antes del cierre.');
      return;
    }

    const token = await withToken();
    if (!token) return;
    try {
      setSaving(true);
      await apiRequest(`/elections/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        json: {
          title: title.trim(),
          description: description.trim() || undefined,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        },
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('La eleccion se actualizo correctamente.');
        router.replace('/admin/elections');
      } else {
        Alert.alert('Guardado', 'La eleccion se actualizo correctamente.', [
          {
            text: 'OK',
            onPress: () => router.replace('/admin/elections'),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo actualizar la eleccion.'));
    } finally {
      setSaving(false);
    }
  };

  const dirty = useMemo(() => {
    const currentStarts = startsAt ? startsAt.getTime() : null;
    const currentEnds = endsAt ? endsAt.getTime() : null;
    return (
      title.trim() !== baselineTitle.trim() ||
      description.trim() !== baselineDescription.trim() ||
      currentStarts !== baselineStartsAt ||
      currentEnds !== baselineEndsAt
    );
  }, [
    title,
    description,
    startsAt,
    endsAt,
    baselineTitle,
    baselineDescription,
    baselineStartsAt,
    baselineEndsAt,
  ]);

  const handleBack = () => {
    if (!dirty) {
      router.replace('/admin/elections');
      return;
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm(
        'Salir sin guardar\n\n?Estas seguro que deseas salir sin guardar tus cambios?',
      );
      if (ok) {
        router.replace('/admin/elections');
      }
      return;
    }
    Alert.alert('Salir sin guardar', '?Estas seguro que deseas salir sin guardar tus cambios?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => router.replace('/admin/elections') },
    ]);
  };

  const startEditCandidate = (candidate: Candidate) => {
    setEditingId(String(candidate.id));
    setEditName(candidate.name);
    setEditPlan(candidate.plan ?? '');
  };

  const cancelEditCandidate = () => {
    setEditingId(null);
    setEditName('');
    setEditPlan('');
  };

  const handleUpdateCandidate = async (candidateId: string) => {
    const token = await withToken();
    if (!token) return;
    if (!editName.trim() && !editPlan.trim()) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Ingresa nombre o plan para actualizar.');
      } else {
        Alert.alert('Datos incompletos', 'Ingresa nombre o plan para actualizar.');
      }
      return;
    }
    try {
      await apiRequest(`/elections/${id}/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        json: {
          name: editName.trim() || undefined,
          plan: editPlan.trim() || undefined,
        },
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('El candidato fue actualizado correctamente.');
      } else {
        Alert.alert('Candidato actualizado', 'El candidato fue actualizado correctamente.');
      }
      cancelEditCandidate();
      await load();
    } catch (error) {
      const message = resolveErrorMessage(error, 'No se pudo actualizar el candidato.');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando eleccion...</Text>
        </View>
      </Screen>
    );
  }

  if (!election) {
    return (
      <Screen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Eleccion no disponible.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <BackButton label="Elecciones" fallbackHref="/admin/elections" onPress={handleBack} />
        <PrimaryButton
          label={saving ? 'Guardando...' : 'Guardar'}
          onPress={handleSaveElection}
          disabled={saving || !dirty}
          variant="soft"
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar eleccion</Text>
          <Text style={styles.meta}>Estado: {election.status}</Text>
        </View>

        <View style={styles.section}>
          <InputField label="Titulo" value={title} onChangeText={setTitle} />
          <InputField
            label="Descripcion"
            value={description}
            onChangeText={setDescription}
          />
          <DateTimeField label="Apertura" value={startsAt} onChange={setStartsAt} />
          <DateTimeField label="Cierre" value={endsAt} onChange={setEndsAt} />
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Estado automatico</Text>
          <Text style={styles.noticeText}>
            La apertura y cierre se gestionan automaticamente segun la fecha y hora configuradas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidatos</Text>
          {election.candidates.map((candidate) => {
            const candidateKey = String(candidate.id);
            return (
              <View key={candidateKey} style={styles.card}>
              <Text style={styles.cardTitle}>{candidate.name}</Text>
              {candidate.plan ? (
                <Text style={styles.cardText}>{candidate.plan}</Text>
              ) : null}
              {editingId === candidateKey ? (
                <View style={styles.editBlock}>
                  <InputField label="Nombre" value={editName} onChangeText={setEditName} />
                  <InputField
                    label="Plan (opcional)"
                    value={editPlan}
                    onChangeText={setEditPlan}
                  />
                  <View style={styles.editActions}>
                    <PrimaryButton
                      label="Guardar"
                      onPress={() => handleUpdateCandidate(candidateKey)}
                    />
                    <PrimaryButton label="Cancelar" variant="ghost" onPress={cancelEditCandidate} />
                  </View>
                </View>
              ) : (
                <View style={styles.cardActions}>
                  <PrimaryButton
                    label="Editar"
                    variant="soft"
                    onPress={() => startEditCandidate(candidate)}
                  />
                  <PrimaryButton
                    label="Eliminar"
                    variant="ghost"
                    onPress={() => handleRemoveCandidate(candidateKey)}
                  />
                </View>
              )}
            </View>
          )})}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agregar candidato</Text>
          <InputField
            label="Nombre"
            value={candidateName}
            onChangeText={setCandidateName}
          />
          <InputField
            label="Plan (opcional)"
            value={candidatePlan}
            onChangeText={setCandidatePlan}
          />
          <PrimaryButton label="Agregar" onPress={handleAddCandidate} />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
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
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    marginTop: 6,
  },
  noticeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 6,
  },
  noticeTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noticeText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
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
  },
  cardActions: {
    gap: 10,
  },
  editBlock: {
    gap: 12,
    marginTop: 8,
  },
  editActions: {
    gap: 10,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
  },
});
