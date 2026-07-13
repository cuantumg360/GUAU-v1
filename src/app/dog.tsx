import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  ageFromBirthDate,
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
import { usePetPhotoUrl, usePrimaryPet, useUpdatePet, useUploadPetPhoto, type Pet } from '@/features/pets/api';

function isoToSpanish(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function DogProfile() {
  const { t } = useTranslation();
  const petQuery = usePrimaryPet();
  const pet = petQuery.data;

  if (!pet) {
    return (
      <Screen>
        <AppText tone="secondary">{t('common.loading')}</AppText>
      </Screen>
    );
  }
  return <DogProfileLoaded pet={pet} />;
}

function DogProfileLoaded({ pet }: { pet: Pet }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const updatePet = useUpdatePet();
  const uploadPhoto = useUploadPetPhoto();
  const photoQuery = usePetPhotoUrl(pet.photo_path);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pet.name);
  const [sex, setSex] = useState<PetInput['sex']>(pet.sex);
  const [neutered, setNeutered] = useState<PetInput['reproductive_status']>(pet.reproductive_status);
  const [birthText, setBirthText] = useState(pet.birth_date ? isoToSpanish(pet.birth_date) : '');
  const [breed, setBreed] = useState(pet.breed ?? '');
  const [isMixed, setIsMixed] = useState(pet.is_mixed_breed);
  const [weightText, setWeightText] = useState(pet.weight_kg !== null ? String(pet.weight_kg).replace('.', ',') : '');
  const [activity, setActivity] = useState<PetInput['activity_level']>(pet.activity_level);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const age = pet.birth_date ? ageFromBirthDate(pet.birth_date) : null;

  const changePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        await uploadPhoto.mutateAsync({ petId: pet.id, localUri: result.assets[0].uri });
      } catch {
        setError(t('common.error_generic'));
      }
    }
  };

  const save = async () => {
    setError(null);
    setSaved(false);
    let birthIso: string | null = null;
    if (birthText.trim() !== '') {
      birthIso = parseSpanishDate(birthText);
      if (!birthIso) {
        setError(t('onboarding.age_date_error'));
        return;
      }
    }
    if (weightText.trim() !== '' && parseWeightKg(weightText) === null) {
      setError(t('onboarding.weight_error'));
      return;
    }
    const input: PetInput = {
      name: name.trim(),
      sex,
      reproductive_status: neutered,
      birth_date: birthIso,
      // Si el usuario escribe una fecha exacta al editar, deja de ser aproximada.
      birth_date_is_approx: birthIso !== null ? false : pet.birth_date_is_approx,
      breed: breed.trim() === '' ? null : breed.trim(),
      is_mixed_breed: isMixed,
      weight_kg: weightText.trim() === '' ? null : parseWeightKg(weightText),
      activity_level: activity,
    };
    const parsed = petInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(t('common.error_generic'));
      return;
    }
    try {
      await updatePet.mutateAsync({ id: pet.id, input: parsed.data });
      setEditing(false);
      setSaved(true);
    } catch {
      setError(t('common.error_generic'));
    }
  };

  const sexLabel = { male: t('dog.sex_male'), female: t('dog.sex_female'), unknown: t('dog.sex_unknown') }[pet.sex];
  const neuteredLabel = { neutered: t('dog.yes'), intact: t('dog.no'), unknown: t('dog.unknown') }[pet.reproductive_status];
  const activityLabel = {
    low: t('dog.activity_low'),
    medium: t('dog.activity_medium'),
    high: t('dog.activity_high'),
    unknown: t('dog.unknown'),
  }[pet.activity_level];

  return (
    <Screen>
      <AppText variant="display">{t('dog.profile_title', { name: pet.name })}</AppText>

      <View style={styles.photoBlock}>
        {photoQuery.data ? (
          <Image source={{ uri: photoQuery.data }} style={[styles.photo, { borderColor: colors.border }]} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <AppText variant="display">{pet.name.slice(0, 1).toUpperCase()}</AppText>
          </View>
        )}
        <Button
          label={photoQuery.data ? t('onboarding.photo_change') : t('onboarding.photo_pick')}
          variant="secondary"
          loading={uploadPhoto.isPending}
          onPress={() => void changePhoto()}
        />
      </View>

      {!editing ? (
        <>
          <Card>
            <Row label={t('dog.field_name')} value={pet.name} />
            <Row label={t('dog.field_sex')} value={sexLabel} />
            <Row label={t('dog.field_neutered')} value={neuteredLabel} />
            <Row
              label={t('dog.field_birth')}
              value={
                pet.birth_date
                  ? pet.birth_date_is_approx
                    ? t('dog.field_birth_approx', { date: isoToSpanish(pet.birth_date) })
                    : isoToSpanish(pet.birth_date)
                  : t('dog.unknown')
              }
            />
            <Row
              label={t('dog.field_breed')}
              value={
                pet.breed
                  ? pet.is_mixed_breed
                    ? t('dog.field_breed_mixed', { breed: pet.breed })
                    : pet.breed
                  : pet.is_mixed_breed
                    ? t('dog.field_mixed_unknown')
                    : t('dog.unknown')
              }
            />
            <Row label={t('dog.field_weight')} value={pet.weight_kg !== null ? `${String(pet.weight_kg).replace('.', ',')} kg` : t('dog.unknown')} />
            <Row label={t('dog.field_activity')} value={activityLabel} />
            {age ? (
              <Row
                label="Edad"
                value={
                  age.years > 0 ? t('dog.age_years', { count: age.years }) : t('dog.age_months', { count: age.months })
                }
              />
            ) : null}
          </Card>
          <AppText variant="caption" tone="secondary">
            {t('dog.provenance_note')}
          </AppText>
          {saved ? <AppText tone="primary">{t('dog.save_success')}</AppText> : null}
          <Button label={t('dog.edit')} variant="secondary" onPress={() => setEditing(true)} />
        </>
      ) : (
        <View style={styles.form}>
          <TextField label={t('dog.field_name')} value={name} onChangeText={setName} maxLength={60} />
          <AppText variant="label" tone="secondary">{t('dog.field_sex')}</AppText>
          <View style={styles.chips}>
            <OptionChip label={t('dog.sex_male')} selected={sex === 'male'} onPress={() => setSex('male')} />
            <OptionChip label={t('dog.sex_female')} selected={sex === 'female'} onPress={() => setSex('female')} />
            <OptionChip label={t('common.unknown')} selected={sex === 'unknown'} onPress={() => setSex('unknown')} />
          </View>
          <AppText variant="label" tone="secondary">{t('dog.field_neutered')}</AppText>
          <View style={styles.chips}>
            <OptionChip label={t('dog.yes')} selected={neutered === 'neutered'} onPress={() => setNeutered('neutered')} />
            <OptionChip label={t('dog.no')} selected={neutered === 'intact'} onPress={() => setNeutered('intact')} />
            <OptionChip label={t('common.unknown')} selected={neutered === 'unknown'} onPress={() => setNeutered('unknown')} />
          </View>
          <TextField
            label={t('onboarding.age_date_label')}
            placeholder={t('onboarding.age_date_placeholder')}
            value={birthText}
            onChangeText={setBirthText}
          />
          <TextField label={t('dog.field_breed')} value={breed} onChangeText={setBreed} />
          <View style={styles.chips}>
            <OptionChip label={t('onboarding.breed_mixed')} selected={isMixed} onPress={() => setIsMixed(!isMixed)} />
          </View>
          <TextField
            label={`${t('dog.field_weight')} (kg)`}
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
          />
          <AppText variant="label" tone="secondary">{t('dog.field_activity')}</AppText>
          <View style={styles.chips}>
            <OptionChip label={t('dog.activity_low')} selected={activity === 'low'} onPress={() => setActivity('low')} />
            <OptionChip label={t('dog.activity_medium')} selected={activity === 'medium'} onPress={() => setActivity('medium')} />
            <OptionChip label={t('dog.activity_high')} selected={activity === 'high'} onPress={() => setActivity('high')} />
          </View>
          {error ? <AppText tone="danger">{error}</AppText> : null}
          <Button label={t('common.save')} onPress={() => void save()} loading={updatePet.isPending} />
          <Button label={t('common.cancel')} variant="ghost" onPress={() => setEditing(false)} />
        </View>
      )}
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
  photoBlock: { alignItems: 'center', gap: spacing.sm },
  photo: { width: 140, height: 140, borderRadius: radius.lg, borderWidth: 1 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  form: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
