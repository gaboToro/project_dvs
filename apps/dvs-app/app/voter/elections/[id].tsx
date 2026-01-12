import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
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
  candidates: Candidate[];
};

export default function ElectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'error' | 'success' | 'warn' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasSelection = useMemo(() => Boolean(selectedId), [selectedId]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<Election>(`/elections/${id}`);
        setElection(data);
      } catch (error) {
        const message =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: string }).message)
            : 'No se pudo cargar la eleccion.';
        Alert.alert('Error', message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    getRole().then((role) => {
      if (role === 'admin') {
        Alert.alert('Acceso denegado', 'Solo los votantes pueden emitir votos.');
        router.replace('/home');
      }
    });
  }, [router]);

  const handleVote = async () => {
    const token = await getToken();
    if (!token) {
      setStatusTone('error');
      setStatusMessage('Sesion invalida, inicia sesion nuevamente.');
      router.replace('/login');
      return;
    }
    if (!selectedId) {
      setStatusTone('warn');
      setStatusMessage('Selecciona un candidato antes de continuar.');
      return;
    }

    try {
      if (submitting) return;
      setSubmitting(true);
      await apiRequest('/votes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        json: { electionId: id, candidateId: selectedId },
      });
      setStatusTone('success');
      setStatusMessage('Tu voto fue registrado correctamente.');
      router.replace({ pathname: '/voter/confirm', params: { electionId: id } });
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(resolveErrorMessage(error, 'No se pudo registrar el voto.'));
    } finally {
      setSubmitting(false);
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
      <BackButton label="Elecciones" fallbackHref="/voter/elections" />
      <ScrollView contentContainerStyle={styles.content}>
        {statusMessage ? (
          <View style={[styles.banner, styles[`banner${statusTone}`]]}>
            <Text style={styles.bannerText}>{statusMessage}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{election.title}</Text>
        {election.description ? (
          <Text style={styles.subtitle}>{election.description}</Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidatos</Text>
          <View style={styles.list}>
            {election.candidates.map((candidate) => {
              const active = candidate.id === selectedId;
              return (
                <Pressable
                  key={candidate.id}
                  onPress={() => setSelectedId(candidate.id)}
                  style={[styles.candidateCard, active && styles.candidateCardActive]}
                >
                  <Text
                    style={[
                      styles.candidateName,
                      active && styles.candidateNameActive,
                    ]}
                  >
                    {candidate.name}
                  </Text>
                  {candidate.plan ? (
                    <Text style={styles.candidatePlan}>{candidate.plan}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <PrimaryButton
          label={submitting ? 'Registrando voto...' : hasSelection ? 'Confirmar voto' : 'Selecciona un candidato'}
          onPress={handleVote}
          disabled={!hasSelection || submitting}
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
  list: {
    gap: 12,
  },
  candidateCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  candidateCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FFF9E6',
  },
  candidateName: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  candidateNameActive: {
    color: theme.colors.accentDark,
  },
  candidatePlan: {
    marginTop: 6,
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 13,
    lineHeight: 18,
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
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannererror: {
    borderColor: '#E07A6A',
    backgroundColor: '#FCEBE8',
  },
  bannersuccess: {
    borderColor: '#7CC7B5',
    backgroundColor: '#E7F6F1',
  },
  bannerwarn: {
    borderColor: '#E2C067',
    backgroundColor: '#FFF5D6',
  },
  bannerText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: 13,
  },
});
