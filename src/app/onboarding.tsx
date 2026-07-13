import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  approximateBirthDate,
  parseSpanishDate,
  parseWeightKg,
  petInputSchema,
  type PetInput,
} from '@/core/petSchema';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { OptionChip } from '@/design/components/OptionChip';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { Mascot, type MascotState } from '@/features/character/Mascot';
import { useCreatePet, useUploadPetPhoto } from '@/features/pets/api';
import { track } from '@/lib/analytics';

type Step = 'intro' | 'name' | 'sex' | 'birth' | 'breed' | 'body' | 'photo';
const STEPS: Step[] = ['intro', 'name', 'sex', 'birth', 'breed', 'body', 'photo'];

export default function Onboarding() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const createPet = useCreatePet();
  const uploadPhoto = useUploadPetPhoto();

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<PetInput['sex']>('unknown');
  const [neutered, setNeutered] = useState<PetInput['reproductive_status']>('unknown');
  const [birthMode, setBirthMode] = useState<'exact' | 'approx'>('exact');
  const [birthText, setBirthText] = useState('');
  const [approxYears, setApproxYears] = useState<number | null>(null);
  const [breed, setBreed] = useState('');
  const [isMixed, setIsMixed] = useState(false);
  const [weightText, setWeightText] = useState('');
  const [activity, setActivity] = useState<PetInput['activity_level']>('unknown');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const step = STEPS[stepIndex];

  useEffect(() => {
    track(stepIndex === 0 ? 'onboarding_started' : 'onboarding_step_viewed', { step });
  }, [step, stepIndex]);

  const resolveBirthDate = (): { date: string | null; approx: boolean } | null => {
    if (birthMode === 'exact') {
      if (birthText.trim() === '') return { date: null, approx: false };
      const iso = parseSpanishDate(birthText);
      if (!iso) return null;
      return { date: iso, approx: false };
    }
    if (approxYears === null) return { date: null, approx: false };
    return { date: approximateBirthDate(approxYears), approx: true };
  };

  const goNext = () => {
    setStepError(null);
    if (step === 'name' && (name.trim().length === 0 || name.trim().length > 60)) {
      setStepError(t('onboarding.name_error'));
      return;
    }
    if (step === 'birth' && resolveBirthDate() === null) {
      setStepError(t('onboarding.age_date_error'));
      return;
    }
    if (step === 'body' && weightText.trim() !== '' && parseWeightKg(weightText) === null) {
      setStepError(t('onboarding.weight_error'));
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    setStepError(null);
    const birth = resolveBirthDate();
    const input: PetInput = {
      name: name.trim(),
      sex,
      reproductive_status: neutered,
      birth_date: birth?.date ?? null,
      birth_date_is_approx: birth?.approx ?? false,
      breed: breed.trim() === '' ? null : breed.trim(),
      is_mixed_breed: isMixed,
      weight_kg: weightText.trim() === '' ? null : parseWeightKg(weightText),
      activity_level: activity,
    };
    const parsed = petInputSchema.safeParse(input);
    if (!parsed.success) {
      setStepError(t('common.error_generic'));
      return;
    }
    try {
      const pet = await createPet.mutateAsync(parsed.data);
      if (photoUri) {
        try {
          await uploadPhoto.mutateAsync({ petId: pet.id, localUri: photoUri });
        } catch {
          // La foto no bloquea el alta; se puede volver a subir desde el perfil.
        }
      }
      track('onboarding_completed');
      router.replace('/(tabs)');
    } catch {
      setStepError(t('common.error_generic'));
    }
  };

  const mascotState: MascotState = step === 'intro' ? 'happy' : 'attentive';
  const busy = createPet.isPending || uploadPhoto.isPending;

  return (
    <Screen>
      <View style={styles.header}>
        <Mascot state={mascotState} size={72} />
        {stepIndex > 0 ? (
          <AppText variant="caption" tone="secondary">
            {t('onboarding.step_of', { current: stepIndex, total: STEPS.length - 1 })}
          </AppText>
        ) : null}
      </View>

      {step === 'intro' ? (
        <View style={styles.block}>
          <AppText variant="display">{t('onboarding.intro_title')}</AppText>
          <AppText tone="secondary">{t('onboarding.intro_body')}</AppText>
          <AppText variant="caption" tone="secondary">
            {t('character.onboarding_hello')}
          </AppText>
        </View>
      ) : null}

      {step === 'name' ? (
        <View style={styles.block}>
          <AppText variant="title">{t('onboarding.name_question')}</AppText>
          <TextField
            placeholder={t('onboarding.name_placeholder')}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={60}
            error={stepError ?? undefined}
          />
        </View>
      ) : null}

      {step === 'sex' ? (
        <View style={styles.block}>
          <AppText variant="title">{t('onboarding.sex_question', { name: name.trim() })}</AppText>
          <View style={styles.chips}>
            <OptionChip label={t('onboarding.sex_male')} selected={sex === 'male'} onPress={() => setSex('male')} />
            <OptionChip label={t('onboarding.sex_female')} selected={sex === 'female'} onPress={() => setSex('female')} />
            <OptionChip label={t('common.unknown')} selected={sex === 'unknown'} onPress={() => setSex('unknown')} />
          </View>
          <AppText variant="heading" style={styles.subQuestion}>
            {t('onboarding.neutered_question')}
          </AppText>
          <View style={styles.chips}>
            <OptionChip label={t('onboarding.neutered_yes')} selected={neutered === 'neutered'} onPress={() => setNeutered('neutered')} />
            <OptionChip label={t('onboarding.neutered_no')} selected={neutered === 'intact'} onPress={() => setNeutered('intact')} />
            <OptionChip label={t('common.unknown')} selected={neutered === 'unknown'} onPress={() => setNeutered('unknown')} />
          </View>
        </View>
      ) : null}

      {step === 'birth' ? (
        <View style={styles.block}>
          <AppText variant="title">{t('onboarding.age_question', { name: name.trim() })}</AppText>
          <View style={styles.chips}>
            <OptionChip label={t('onboarding.age_exact')} selected={birthMode === 'exact'} onPress={() => setBirthMode('exact')} />
            <OptionChip label={t('onboarding.age_approx')} selected={birthMode === 'approx'} onPress={() => setBirthMode('approx')} />
          </View>
          {birthMode === 'exact' ? (
            <TextField
              label={t('onboarding.age_date_label')}
              placeholder={t('onboarding.age_date_placeholder')}
              value={birthText}
              onChangeText={setBirthText}
              keyboardType="numbers-and-punctuation"
              error={stepError ?? undefined}
            />
          ) : (
            <View>
              <AppText variant="label" tone="secondary">
                {t('onboarding.age_years_label')}
              </AppText>
              <View style={[styles.chips, styles.yearChips]}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map((y) => (
                  <OptionChip key={y} label={String(y)} selected={approxYears === y} onPress={() => setApproxYears(y)} />
                ))}
              </View>
              <AppText variant="caption" tone="secondary">
                {t('onboarding.age_unknown_hint')}
              </AppText>
            </View>
          )}
        </View>
      ) : null}

      {step === 'breed' ? (
        <View style={styles.block}>
          <AppText variant="title">{t('onboarding.breed_question')}</AppText>
          <TextField placeholder={t('onboarding.breed_placeholder')} value={breed} onChangeText={setBreed} />
          <View style={styles.chips}>
            <OptionChip label={t('onboarding.breed_mixed')} selected={isMixed} onPress={() => setIsMixed(!isMixed)} />
          </View>
          <AppText variant="caption" tone="secondary">
            {t('onboarding.breed_hint')}
          </AppText>
        </View>
      ) : null}

      {step === 'body' ? (
        <View style={styles.block}>
          <AppText variant="title">{t('onboarding.weight_question', { unit: 'kg' })}</AppText>
          <TextField
            placeholder={t('onboarding.weight_placeholder')}
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
            error={stepError ?? undefined}
          />
          <AppText variant="heading" style={styles.subQuestion}>
            {t('onboarding.activity_question')}
          </AppText>
          <View style={styles.chips}>
            <OptionChip label={t('onboarding.activity_low')} selected={activity === 'low'} onPress={() => setActivity('low')} />
            <OptionChip label={t('onboarding.activity_medium')} selected={activity === 'medium'} onPress={() => setActivity('medium')} />
            <OptionChip label={t('onboarding.activity_high')} selected={activity === 'high'} onPress={() => setActivity('high')} />
          </View>
        </View>
      ) : null}

      {step === 'photo' ? (
        <View style={styles.block}>
          <AppText variant="title">{t('onboarding.photo_question')}</AppText>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={[styles.photo, { borderColor: colors.border }]} />
          ) : null}
          <Button
            label={photoUri ? t('onboarding.photo_change') : t('onboarding.photo_pick')}
            variant="secondary"
            onPress={() => void pickPhoto()}
          />
          <AppText variant="caption" tone="secondary">
            {t('onboarding.photo_hint')}
          </AppText>
          <Card>
            <AppText variant="heading">{t('onboarding.summary_title')}</AppText>
            <AppText tone="secondary">{t('onboarding.summary_body', { name: name.trim() })}</AppText>
          </Card>
          {stepError ? <AppText tone="danger">{stepError}</AppText> : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        {step === 'photo' ? (
          <Button
            label={busy ? t('onboarding.creating') : t('onboarding.create_cta', { name: name.trim() })}
            onPress={() => void submit()}
            loading={busy}
          />
        ) : (
          <Button label={t('common.continue')} onPress={goNext} />
        )}
        {stepIndex > 0 ? <Button label={t('common.back')} variant="ghost" onPress={goBack} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs },
  block: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  yearChips: { marginVertical: spacing.xs },
  subQuestion: { marginTop: spacing.sm },
  photo: { width: 160, height: 160, borderRadius: radius.lg, borderWidth: 1, alignSelf: 'center' },
  footer: { marginTop: spacing.lg, gap: spacing.xs },
});
