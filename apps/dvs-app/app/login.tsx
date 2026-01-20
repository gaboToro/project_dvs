import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/lib/api';
import { decodeJwtRole, setRole, setToken } from '@/lib/auth';
import { resolveErrorMessage } from '@/lib/error-messages';
import { theme } from '@/lib/theme';

type LoginResponse = {
  accessToken: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Faltan datos', 'Ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { username, password },
      });
      await setToken(data.accessToken);
      const role = decodeJwtRole(data.accessToken) ?? (username === 'admin' ? 'admin' : 'voter');
      await setRole(role);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', resolveErrorMessage(error, 'No se pudo iniciar sesion.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Universidad Central del Ecuador</Text>
        <Text style={styles.title}>Digital Voting System</Text>
        <Text style={styles.subtitle}>
          Plataforma de voto digital para procesos universitarios.
        </Text>
      </View>

      <View style={styles.form}>
        <InputField
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <InputField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <PrimaryButton
          label={loading ? 'Ingresando...' : 'Ingresar'}
          onPress={handleLogin}
          disabled={loading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Admin: admin / admin</Text>
        <Text style={styles.footerText}>Votante: voter1 / voter1</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 28,
    gap: 10,
  },
  kicker: {
    color: theme.colors.accentDark,
    fontFamily: theme.fonts.subheading,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  title: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.heading,
    fontSize: 30,
  },
  subtitle: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  footer: {
    paddingVertical: 18,
  },
  footerText: {
    color: theme.colors.slate,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
});
