import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { demoStore, isDemo } from '@/features/demo/store';
import { track } from '@/lib/analytics';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Memory = Tables<'memories'>;
export type MemoryVersion = Tables<'memory_versions'>;

const LIST_KEY = ['memories'] as const;

export function useMemories() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async (): Promise<Memory[]> => {
      if (isDemo()) return demoStore.memories();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .is('deleted_at', null)
        .order('experienced_on', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMemory(id: string | undefined) {
  return useQuery({
    queryKey: ['memory', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (isDemo()) return demoStore.memory(id!);
      const { data: memory, error } = await supabase.from('memories').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      const { data: versions, error: vErr } = await supabase
        .from('memory_versions')
        .select('*')
        .eq('memory_id', id!)
        .order('version', { ascending: false });
      if (vErr) throw vErr;
      return { memory, versions: versions ?? [] };
    },
  });
}

type CreateInput = {
  title: string | null;
  originalText: string;
  experiencedOn: string | null;
  inputKind: 'text' | 'voice';
  originalTranscript?: string | null;
  petId?: string | null;
  /** URI local del audio a subir (solo voz). */
  audioUri?: string | null;
};

export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput): Promise<Memory> => {
      if (isDemo()) {
        track('memory_created', { kind: input.inputKind });
        return demoStore.addMemory(input);
      }
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('not_authenticated');
      const userId = userData.user.id;

      let audioPath: string | null = null;
      if (input.inputKind === 'voice' && input.audioUri) {
        const response = await fetch(input.audioUri);
        const buffer = await response.arrayBuffer();
        const path = `${userId}/${Date.now()}.m4a`;
        const { error: upErr } = await supabase.storage
          .from('memory-audio')
          .upload(path, buffer, { contentType: 'audio/m4a', upsert: false });
        if (upErr) throw upErr;
        audioPath = path;
      }

      const { data, error } = await supabase
        .from('memories')
        .insert({
          owner_id: userId,
          pet_id: input.petId ?? null,
          title: input.title,
          original_text: input.originalText,
          original_transcript: input.originalTranscript ?? null,
          experienced_on: input.experiencedOn,
          input_kind: input.inputKind,
          audio_path: audioPath,
        })
        .select()
        .single();
      if (error) throw error;
      track('memory_created', { kind: input.inputKind });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

/**
 * Guarda una versión editada del recuerdo SIN tocar el original. Inserta una
 * fila nueva en memory_versions (append-only). Conserva todo el historial.
 */
export function useSaveMemoryVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memoryId,
      content,
      producedBy = 'manual',
    }: {
      memoryId: string;
      content: string;
      producedBy?: 'manual' | 'ai';
    }): Promise<MemoryVersion> => {
      if (isDemo()) {
        const row = demoStore.addMemoryVersion(memoryId, content);
        track('memory_version_saved', { version: row.version, by: producedBy });
        return row;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('not_authenticated');

      const { data: last } = await supabase
        .from('memory_versions')
        .select('version')
        .eq('memory_id', memoryId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextVersion = (last?.version ?? 0) + 1;

      const { data, error } = await supabase
        .from('memory_versions')
        .insert({ memory_id: memoryId, owner_id: userData.user.id, version: nextVersion, content, produced_by: producedBy })
        .select()
        .single();
      if (error) throw error;
      track('memory_version_saved', { version: nextVersion, by: producedBy });
      return data;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['memory', vars.memoryId] });
      void queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memory: Memory): Promise<void> => {
      if (isDemo()) {
        demoStore.deleteMemory(memory.id);
        track('memory_deleted');
        return;
      }
      // Soft delete; el audio se elimina físicamente si existe.
      const { error } = await supabase
        .from('memories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', memory.id);
      if (error) throw error;
      if (memory.audio_path) {
        await supabase.storage.from('memory-audio').remove([memory.audio_path]);
      }
      track('memory_deleted');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useMemoryAudioUrl(audioPath: string | null) {
  return useQuery({
    queryKey: ['memory_audio_url', audioPath],
    enabled: audioPath !== null,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!audioPath) return null;
      if (isDemo()) return audioPath; // uri local en modo prueba
      const { data, error } = await supabase.storage.from('memory-audio').createSignedUrl(audioPath, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
