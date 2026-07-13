import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Screen } from '@/design/components/Screen';
import { spacing } from '@/design/tokens';
import { Mascot } from '@/features/character/Mascot';
import { enableDemo } from '@/features/demo/store';

export default function Welcome() {
  const { t } = useTranslation();
  const router = useRouter();

  const startDemo = async () => {
    await enableDemo();
    router.replace('/');
  };

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <Mascot state="happy" size={140} />
        <AppText variant="display" style={styles.title}>
          {t('auth.welcome_title')}
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.title}>
          {t('auth.welcome_subtitle')}
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button label={t('auth.create_account')} onPress={() => router.push('/sign-up')} />
        <Button label={t('auth.have_account')} variant="ghost" onPress={() => router.push('/sign-in')} />
        <Button label={t('auth.try_demo')} variant="secondary" onPress={() => void startDemo()} />
        <AppText variant="caption" tone="secondary" style={styles.title}>
          {t('auth.try_demo_hint')}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  title: { textAlign: 'center' },
  actions: { gap: spacing.xs },
});
