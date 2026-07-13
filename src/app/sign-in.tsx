import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Screen } from '@/design/components/Screen';
import { spacing } from '@/design/tokens';
import { TextField } from '@/design/components/TextField';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes('invalid')
          ? t('auth.error_invalid_credentials')
          : t('common.error_generic'),
      );
      return;
    }
    track('signin_completed');
    router.replace('/');
  };

  return (
    <Screen>
      <AppText variant="display">{t('auth.signin_title')}</AppText>
      <View style={styles.form}>
        <TextField
          label={t('auth.email_label')}
          placeholder={t('auth.email_placeholder')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label={t('auth.password_label')}
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          error={error ?? undefined}
        />
      </View>
      <Button label={t('auth.signin_cta')} onPress={() => void submit()} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
