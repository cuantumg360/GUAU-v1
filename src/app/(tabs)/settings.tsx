import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { spacing } from '@/design/tokens';
import { useAuth } from '@/features/auth/AuthProvider';
import { track } from '@/lib/analytics';
import { usePawBalance } from '@/lib/remoteConfig';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const pawQuery = usePawBalance();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const signOut = async () => {
    track('signout');
    await supabase.auth.signOut();
    router.replace('/welcome');
  };

  const confirmDelete = () => {
    Alert.alert(t('settings.delete_confirm_title'), t('settings.delete_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.delete_confirm_cta'),
        style: 'destructive',
        onPress: () => void deleteAccount(),
      },
    ]);
  };

  const deleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    track('account_delete_requested');
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    setDeleting(false);
    if (error) {
      setDeleteError(t('settings.delete_error'));
      return;
    }
    await supabase.auth.signOut();
    router.replace('/welcome');
  };

  return (
    <Screen>
      <AppText variant="display">{t('settings.tab_title')}</AppText>

      <Card>
        <AppText variant="heading">{t('settings.account_section')}</AppText>
        <Row label={t('settings.email')} value={session?.user.email ?? '—'} />
        <Row label={t('settings.plan')} value={t('settings.plan_free')} />
        {typeof pawQuery.data === 'number' ? (
          <Row label={t('settings.paws')} value={String(pawQuery.data)} />
        ) : null}
        <Row label={t('settings.language')} value={t('settings.language_value')} />
        <Row label={t('settings.version')} value={Constants.expoConfig?.version ?? '0.1.0'} />
      </Card>

      <Card health>
        <AppText variant="heading" tone="health">
          {t('settings.privacy_section')}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {t('settings.privacy_note')}
        </AppText>
      </Card>

      <View style={styles.actions}>
        <Button label={t('settings.signout')} variant="secondary" onPress={() => void signOut()} />
        <Button
          label={t('settings.delete_account')}
          variant="danger"
          loading={deleting}
          onPress={confirmDelete}
        />
        {deleteError ? <AppText tone="danger">{deleteError}</AppText> : null}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  actions: { gap: spacing.xs, marginTop: spacing.md },
});
