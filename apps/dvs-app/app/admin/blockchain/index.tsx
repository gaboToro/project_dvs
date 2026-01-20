import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { getRole } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type BlockData = {
  voterId: string;
  electionId: string;
  candidateId: string;
  timestamp: number;
};

type Block = {
  index: number;
  timestamp: number;
  data: BlockData;
  prevHash: string;
  hash: string;
};

type VerifyResult = {
  valid: boolean;
  invalidIndex?: number;
  reason?: string;
};

function maskId(value: string | undefined, visible = 6) {
  if (!value) return '-';
  if (value.length <= visible) return value;
  return `${value.slice(0, visible)}...`;
}

export default function BlockchainScreen() {
  const router = useRouter();
  const [chain, setChain] = useState<Block[]>([]);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

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
      const [chainData, verifyData] = await Promise.all([
        apiRequest<Block[]>('/chain'),
        apiRequest<VerifyResult>('/chain/verify'),
      ]);
      setChain(chainData ?? []);
      setVerify(verifyData ?? null);
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo cargar la cadena.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const total = chain.length;
    const last = chain[chain.length - 1];
    return {
      total,
      lastIndex: last?.index ?? '-',
      lastHash: last?.hash ? maskId(last.hash, 12) : '-',
      lastElection: last?.data?.electionId ?? '-',
    };
  }, [chain]);

  return (
    <Screen>
      <BackButton label="Inicio" fallbackHref="/home" onPress={() => router.replace('/home')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Blockchain</Text>
          <Text style={styles.subtitle}>Integridad y registros de la cadena.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verificacion</Text>
          <Text style={[styles.cardMeta, verify?.valid ? styles.ok : styles.down]}>
            {verify?.valid ? 'OK' : 'INVALIDA'}
          </Text>
          {verify && !verify.valid ? (
            <Text style={styles.cardMeta}>
              Bloque: {verify.invalidIndex ?? '-'} | {verify.reason ?? 'error'}
            </Text>
          ) : null}
          <PrimaryButton label="Actualizar" variant="soft" onPress={load} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          <Text style={styles.cardMeta}>Total de bloques: {summary.total}</Text>
          <Text style={styles.cardMeta}>Ultimo indice: {summary.lastIndex}</Text>
          <Text style={styles.cardMeta}>Ultimo hash: {summary.lastHash}</Text>
          <Text style={styles.cardMeta}>Ultima eleccion: {summary.lastElection}</Text>
        </View>

        <View style={styles.list}>
          {chain.length === 0 ? (
            <Text style={styles.cardMeta}>No hay bloques registrados.</Text>
          ) : (
            chain
              .slice(-10)
              .reverse()
              .map((block) => (
                <View key={`${block.index}-${block.hash}`} style={styles.blockCard}>
                  <View style={styles.blockTop}>
                    <Text style={styles.blockTitle}>Bloque #{block.index}</Text>
                    <Text style={styles.blockMeta}>
                      {new Date(block.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.blockMeta}>
                    Eleccion: {block.data?.electionId ?? '-'}
                  </Text>
                  <Text style={styles.blockMeta}>
                    Candidato: {block.data?.candidateId ?? '-'}
                  </Text>
                  <Text style={styles.blockMeta}>
                    Votante: {maskId(block.data?.voterId, 8)}
                  </Text>
                  <Text style={styles.blockMeta}>Hash: {maskId(block.hash, 16)}</Text>
                  <Text style={styles.blockMeta}>
                    Prev: {maskId(block.prevHash, 16)}
                  </Text>
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
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
  card: {
    marginTop: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  cardMeta: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
  ok: {
    color: theme.colors.accent,
  },
  down: {
    color: theme.colors.danger,
  },
  list: {
    paddingTop: 20,
    gap: 12,
  },
  blockCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  blockTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  blockTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 14,
  },
  blockMeta: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
});
