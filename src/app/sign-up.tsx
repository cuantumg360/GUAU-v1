import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { spacing } from '@/design/tokens';
import { TextField } from '@/design/components/TextField';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const submit = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('auth.error_invalid_email'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.error_short_password'));
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already')
          ? t('auth.error_email_taken')
          : t('common.error_generic'),
      );
      return;
    }
    track('signup_completed');
    if (data.session) {
      router.replace('/onboarding');
    } else {
      // El proyecto exige confirmación por correo.
      setAwaitingConfirm(true);
    }
  };

  if (awaitingConfirm) {
    return (
      <Screen>
        <Card>
          <AppText variant="title">{t('auth.confirm_email_title')}</AppText>
          <AppText tone="secondary">{t('auth.confirm_email_body')}</AppText>
        </Card>
        <Button label={t('auth.have_account')} variant="secondary" onPress={() => router.replace('/sign-in')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display">{t('auth.signup_title')}</AppText>
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
          placeholder={t('auth.password_placeholder')}
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          error={error ?? undefined}
        />
      </View>
      <Button label={t('auth.signup_cta')} onPress={() => void submit()} loading={loading} />
      <AppText variant="caption" tone="secondary">
        {t('auth.signup_legal')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
