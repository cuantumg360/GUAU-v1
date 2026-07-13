import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatEuros, validateCustomTopup } from '@/core/pricing';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { useProducts, useTopupConfig, type Product } from '@/features/billing/api';
import { purchases } from '@/features/billing/purchases';
import { track } from '@/lib/analytics';
import { usePawBalance } from '@/lib/remoteConfig';

export default function Paws() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const productsQuery = useProducts();
  const balanceQuery = usePawBalance();
  const configQuery = useTopupConfig();
  const [customText, setCustomText] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => track('paw_pack_viewed'), []);

  const packs = (productsQuery.data ?? []).filter((p) => p.kind === 'paw_pack');
  const config = configQuery.data ?? { min: 5, max: 500, unitPriceCents: 100 };

  const customPaws = Number(customText.replace(',', '.'));
  const customValidation =
    customText.trim() === '' ? null : validateCustomTopup(customPaws, config);

  const showUnavailable = () => {
    Alert.alert(t('billing.unavailable_title'), t('billing.unavailable_body'), [
      { text: t('billing.unavailable_cta') },
    ]);
  };

  const buyPack = async (pack: Product) => {
    track('paw_pack_selected', { product: pack.id, paws: pack.paws ?? 0 });
    track('purchase_started', { product: pack.id });
    const result = await purchases.purchasePaws(pack.id, pack.paws ?? 0);
    if (result.status === 'unavailable') {
      track('purchase_unavailable', { product: pack.id });
      showUnavailable();
    }
  };

  const buyCustom = async () => {
    setCustomError(null);
    if (!customValidation || !customValidation.ok) {
      if (customValidation && !customValidation.ok) {
        setCustomError(
          customValidation.error === 'below_min'
            ? t('billing.custom_error_min', { min: config.min })
            : customValidation.error === 'above_max'
              ? t('billing.custom_error_max', { max: config.max })
              : t('billing.custom_error_integer'),
        );
      }
      return;
    }
    track('purchase_started', { product: 'paw_custom', paws: customPaws });
    const result = await purchases.purchasePaws('paw_custom', customPaws);
    if (result.status === 'unavailable') {
      track('purchase_unavailable', { product: 'paw_custom' });
      showUnavailable();
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">{t('billing.paws_title')}</AppText>
        <View style={[styles.balancePill, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="paw" size={16} color={colors.primary} />
          <AppText variant="label" tone="primary">{balanceQuery.data ?? 0}</AppText>
        </View>
      </View>
      <AppText tone="secondary">{t('billing.paws_subtitle')}</AppText>

      <AppText variant="label" tone="secondary" style={styles.sectionLabel}>
        {t('billing.packs_title')}
      </AppText>
      {packs.map((pack) => (
        <Pressable key={pack.id} accessibilityRole="button" onPress={() => void buyPack(pack)}>
          <Card style={styles.packCard}>
            <View style={[styles.packIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="paw" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading">{t('billing.pack_paws', { count: pack.paws })}</AppText>
              <AppText variant="caption" tone="secondary">
                {t('billing.pack_before', { price: formatEuros(pack.base_price_cents) })}
              </AppText>
            </View>
            <AppText variant="title" tone="primary">{formatEuros(pack.final_price_cents)}</AppText>
          </Card>
        </Pressable>
      ))}

      <AppText variant="label" tone="secondary" style={styles.sectionLabel}>
        {t('billing.custom_title')}
      </AppText>
      <Card>
        <AppText variant="caption" tone="secondary">
          {t('billing.custom_hint', { min: config.min })}
        </AppText>
        <TextField
          label={t('billing.custom_label')}
          value={customText}
          onChangeText={setCustomText}
          keyboardType="number-pad"
          error={customError ?? undefined}
        />
        {customValidation?.ok ? (
          <AppText tone="primary">
            {t('billing.custom_total', { price: formatEuros(customValidation.priceCents) })}
          </AppText>
        ) : null}
        <Button label={t('billing.buy')} onPress={() => void buyCustom()} />
      </Card>

      <Button
        label={t('billing.history_title')}
        variant="ghost"
        onPress={() => router.push('/paw-history')}
      />
      <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
  sectionLabel: { marginTop: spacing.sm },
  packCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  packIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
});
