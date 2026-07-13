import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/core/datetime';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { useTheme } from '@/design/ThemeContext';
import { spacing } from '@/design/tokens';
import { usePawLedger, type PawTransaction } from '@/features/billing/api';

const KIND_LABEL: Record<string, string> = {
  purchase: 'billing.tx_purchase',
  reward: 'billing.tx_reward',
  spend: 'billing.tx_spend',
  refund: 'billing.tx_refund',
  adjustment: 'billing.tx_adjustment',
  subscription_grant: 'billing.tx_subscription_grant',
};

export default function PawHistory() {
  const { t } = useTranslation();
  const router = useRouter();
  const ledgerQuery = usePawLedger();
  const items = ledgerQuery.data ?? [];

  return (
    <Screen>
      <AppText variant="display">{t('billing.history_title')}</AppText>

      {!ledgerQuery.isPending && items.length === 0 ? (
        <Card>
          <AppText tone="secondary">{t('billing.history_empty')}</AppText>
        </Card>
      ) : null}

      {items.map((tx) => (
        <TxRow key={tx.id} tx={tx} />
      ))}

      <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function TxRow({ tx }: { tx: PawTransaction }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const positive = tx.delta > 0;
  return (
    <Card style={styles.row}>
      <View style={[styles.icon, { backgroundColor: positive ? colors.successSoft : colors.surfaceAlt }]}>
        <Ionicons
          name={positive ? 'arrow-down' : 'arrow-up'}
          size={16}
          color={positive ? colors.success : colors.textSecondary}
        />
      </View>
      <View style={styles.flex}>
        <AppText>{t(KIND_LABEL[tx.kind] ?? 'billing.tx_adjustment')}</AppText>
        <AppText variant="caption" tone="secondary">
          {formatDate(tx.created_at, 'Europe/Madrid')}
        </AppText>
      </View>
      <AppText variant="heading" tone={positive ? 'success' : 'default'}>
        {positive ? '+' : ''}{tx.delta}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
});
