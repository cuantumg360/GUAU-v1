import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { petInputSchema, type PetInput } from '@/core/petSchema';
import { track } from '@/lib/analytics';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Pet = Tables<'pets'>;

const PRIMARY_PET_KEY = ['primary_pet'] as const;

export function usePrimaryPet() {
  return useQuery({
    queryKey: PRIMARY_PET_KEY,
    queryFn: async (): Promise<Pet | null> => {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PetInput): Promise<Pet> => {
      const parsed = petInputSchema.parse(input);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('not_authenticated');

      const { data, error } = await supabase
        .from('pets')
        .insert({ ...parsed, owner_id: userData.user.id })
        .select()
        .single();
      if (error) throw error;

      // El onboarding queda completado cuando existe el primer perro.
      await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', userData.user.id);

      track('pet_created', { approx_birth: parsed.birth_date_is_approx });
      return data;
    },
    onSuccess: (pet) => queryClient.setQueryData(PRIMARY_PET_KEY, pet),
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PetInput }): Promise<Pet> => {
      const parsed = petInputSchema.parse(input);
      const { data, error } = await supabase.from('pets').update(parsed).eq('id', id).select().single();
      if (error) throw error;
      track('pet_updated');
      return data;
    },
    onSuccess: (pet) => queryClient.setQueryData(PRIMARY_PET_KEY, pet),
  });
}

/**
 * Sube la foto al bucket privado (ruta {user}/{pet}/{timestamp}.jpg) y guarda
 * la ruta en el perfil del perro. Devuelve el pet actualizado.
 */
export function useUploadPetPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ petId, localUri }: { petId: string; localUri: string }): Promise<Pet> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('not_authenticated');

      const response = await fetch(localUri);
      const arrayBuffer = await response.arrayBuffer();
      const path = `${userData.user.id}/${petId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('pets')
        .update({ photo_path: path })
        .eq('id', petId)
        .select()
        .single();
      if (error) throw error;
      track('pet_photo_added');
      return data;
    },
    onSuccess: (pet) => queryClient.setQueryData(PRIMARY_PET_KEY, pet),
  });
}

/** URL firmada temporal para mostrar la foto privada del perro. */
export function usePetPhotoUrl(photoPath: string | null) {
  return useQuery({
    queryKey: ['pet_photo_url', photoPath],
    enabled: photoPath !== null,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!photoPath) return null;
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .createSignedUrl(photoPath, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
