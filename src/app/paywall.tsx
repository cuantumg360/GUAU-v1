import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatEuros, monthlyEquivalentCents, savingsCents, savingsPercent } from '@/core/pricing';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { useEntitlement, useProducts, type Product } from '@/features/billing/api';
import { purchases } from '@/features/billing/purchases';
import { Mascot } from '@/features/character/Mascot';
import { track } from '@/lib/analytics';

export default function Paywall() {
  const { t } = useTranslation();
  const router = useRouter();
  const productsQuery = useProducts();
  const entitlementQuery = useEntitlement();
  const [selected, setSelected] = useState<'pro_monthly' | 'pro_annual'>('pro_annual');
  const [busy, setBusy] = useState(false);

  useEffect(() => track('paywall_viewed'), []);

  const monthly = productsQuery.data?.find((p) => p.id === 'pro_monthly');
  const annual = productsQuery.data?.find((p) => p.id === 'pro_annual');

  const twelveMonths = (monthly?.final_price_cents ?? 0) * 12;
  const annualCents = annual?.final_price_cents ?? 0;
  const percent = twelveMonths > 0 ? savingsPercent(twelveMonths, annualCents) : 0;
  const savedYear = savingsCents(twelveMonths, annualCents);

  const buy = async () => {
    track('plan_selected', { plan: selected });
    track('purchase_started', { product: selected });
    setBusy(true);
    const result = await purchases.purchaseSubscription(selected);
    setBusy(false);
    if (result.status === 'unavailable') {
      track('purchase_unavailable', { product: selected });
      Alert.alert(t('billing.unavailable_title'), t('billing.unavailable_body'), [
        { text: t('billing.unavailable_cta') },
      ]);
    }
  };

  const isFree = (entitlementQuery.data?.plan ?? 'free') === 'free';

  return (
    <Screen>
      <View style={styles.hero}>
        <Mascot state="happy" size={96} />
        <AppText variant="display" style={styles.center}>{t('billing.plans_title')}</AppText>
        <AppText tone="secondary" style={styles.center}>{t('billing.plans_subtitle')}</AppText>
      </View>

      {annual ? (
        <PlanCard
          product={annual}
          selected={selected === 'pro_annual'}
          onSelect={() => setSelected('pro_annual')}
          title={t('billing.plan_annual')}
          priceLabel={`${formatEuros(annualCents)} ${t('billing.per_year')}`}
          subLabel={t('billing.annual_monthly_equiv', { price: formatEuros(monthlyEquivalentCents(annualCents)) })}
          badge={percent > 0 ? t('billing.save_badge', { percent: Math.round(percent) }) : undefined}
          footnote={savedYear > 0 ? t('billing.save_detail', { amount: formatEuros(savedYear) }) : undefined}
        />
      ) : null}

      {monthly ? (
        <PlanCard
          product={monthly}
          selected={selected === 'pro_monthly'}
          onSelect={() => setSelected('pro_monthly')}
          title={t('billing.plan_monthly')}
          priceLabel={`${formatEuros(monthly.final_price_cents)} ${t('billing.per_month')}`}
        />
      ) : null}

      {isFree ? (
        <AppText variant="caption" tone="secondary" style={styles.center}>
          {t('billing.plan_free_current')}
        </AppText>
      ) : null}

      <Button
        label={t('billing.choose_plan', { plan: selected === 'pro_annual' ? t('billing.plan_annual') : t('billing.plan_monthly') })}
        onPress={() => void buy()}
        loading={busy}
      />
      <Button label={t('billing.restore')} variant="ghost" onPress={() => void purchases.restore()} />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function PlanCard({
  selected,
  onSelect,
  title,
  priceLabel,
  subLabel,
  badge,
  footnote,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  title: string;
  priceLabel: string;
  subLabel?: string;
  badge?: string;
  footnote?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onSelect}>
      <Card style={[styles.planCard, { borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1 }]}>
        <View style={styles.planTop}>
          <View style={styles.flex}>
            <AppText variant="heading">{title}</AppText>
            <AppText variant="title" tone="primary">{priceLabel}</AppText>
            {subLabel ? <AppText variant="caption" tone="secondary">{subLabel}</AppText> : null}
          </View>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
              <AppText variant="label" tone="success">{badge}</AppText>
            </View>
          ) : null}
          <Ionicons
            name={selected ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={selected ? colors.primary : colors.textSecondary}
          />
        </View>
        {footnote ? <AppText variant="caption" tone="secondary">{footnote}</AppText> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  center: { textAlign: 'center' },
  planCard: { gap: spacing.xs },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  badge: { paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: radius.pill },
});
