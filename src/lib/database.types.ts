// Tipos generados desde el esquema real de Supabase (proyecto guau v1).
// Regenerar tras cada migración: ver docs/05-technical-architecture.md.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: Database["public"]["Enums"]["activity_category"]
          closing_question: string
          comfort_signals: string[]
          common_mistakes: string[]
          context: string | null
          created_at: string
          description: string
          difficulty: number
          duration_min: number
          expected_outcome: string | null
          id: string
          materials: string[]
          min_activity_level: Database["public"]["Enums"]["activity_level"]
          objective: string
          precautions: string | null
          preparation: string | null
          published: boolean
          review_status: Database["public"]["Enums"]["activity_review_status"]
          slug: string
          steps: string[]
          stop_signals: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["activity_category"]
          closing_question: string
          comfort_signals?: string[]
          common_mistakes?: string[]
          context?: string | null
          created_at?: string
          description: string
          difficulty: number
          duration_min: number
          expected_outcome?: string | null
          id?: string
          materials?: string[]
          min_activity_level?: Database["public"]["Enums"]["activity_level"]
          objective: string
          precautions?: string | null
          preparation?: string | null
          published?: boolean
          review_status?: Database["public"]["Enums"]["activity_review_status"]
          slug: string
          steps?: string[]
          stop_signals?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["activity_category"]
          closing_question?: string
          comfort_signals?: string[]
          common_mistakes?: string[]
          context?: string | null
          created_at?: string
          description?: string
          difficulty?: number
          duration_min?: number
          expected_outcome?: string | null
          id?: string
          materials?: string[]
          min_activity_level?: Database["public"]["Enums"]["activity_level"]
          objective?: string
          precautions?: string | null
          preparation?: string | null
          published?: boolean
          review_status?: Database["public"]["Enums"]["activity_review_status"]
          slug?: string
          steps?: string[]
          stop_signals?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_completions: {
        Row: {
          activity_id: string
          created_at: string
          dog_response: string | null
          id: string
          local_date: string
          pet_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          dog_response?: string | null
          id?: string
          local_date: string
          pet_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          dog_response?: string | null
          id?: string
          local_date?: string
          pet_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_completions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          app_version: string | null
          client_ts: string | null
          created_at: string
          id: number
          name: string
          platform: string | null
          props: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          client_ts?: string | null
          created_at?: string
          id?: never
          name: string
          platform?: string | null
          props?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          client_ts?: string | null
          created_at?: string
          id?: never
          name?: string
          platform?: string | null
          props?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          meta: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          meta?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          meta?: Json | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          kind: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          id?: string
          kind: string
          user_id: string
          version: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          kind?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      daily_recommendations: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          local_date: string
          status: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          local_date: string
          status?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          local_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_recommendations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          current_period_end: string | null
          plan: Database["public"]["Enums"]["plan_kind"]
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["plan_kind"]
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["plan_kind"]
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          payload: Json | null
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          payload?: Json | null
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          payload?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          daily_activity_enabled: boolean
          push_token: string | null
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          reminders_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_activity_enabled?: boolean
          push_token?: string | null
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          reminders_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_activity_enabled?: boolean
          push_token?: string | null
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          reminders_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operation_costs: {
        Row: {
          active: boolean
          is_provisional: boolean
          operation: string
          paw_cost: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          is_provisional?: boolean
          operation: string
          paw_cost: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          is_provisional?: boolean
          operation?: string
          paw_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      paw_accounts: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paw_ledger: {
        Row: {
          balance_after: number
          balance_before: number
          created_at: string
          delta: number
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["paw_tx_kind"]
          meta: Json | null
          operation: string | null
          purchase_ref: string | null
          reason: string
          related_entity: string | null
          status: Database["public"]["Enums"]["paw_tx_status"]
          user_id: string
        }
        Insert: {
          balance_after: number
          balance_before: number
          created_at?: string
          delta: number
          id?: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["paw_tx_kind"]
          meta?: Json | null
          operation?: string | null
          purchase_ref?: string | null
          reason: string
          related_entity?: string | null
          status?: Database["public"]["Enums"]["paw_tx_status"]
          user_id: string
        }
        Update: {
          balance_after?: number
          balance_before?: number
          created_at?: string
          delta?: number
          id?: string
          idempotency_key?: string
          kind?: Database["public"]["Enums"]["paw_tx_kind"]
          meta?: Json | null
          operation?: string | null
          purchase_ref?: string | null
          reason?: string
          related_entity?: string | null
          status?: Database["public"]["Enums"]["paw_tx_status"]
          user_id?: string
        }
        Relationships: []
      }
      pet_profile_fields: {
        Row: {
          confidence: number | null
          deleted_at: string | null
          field_key: string
          id: string
          pet_id: string
          recorded_at: string
          source: Database["public"]["Enums"]["field_source"]
          source_ref: string | null
          status: Database["public"]["Enums"]["field_status"]
          updated_at: string
          value: Json
        }
        Insert: {
          confidence?: number | null
          deleted_at?: string | null
          field_key: string
          id?: string
          pet_id: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["field_source"]
          source_ref?: string | null
          status?: Database["public"]["Enums"]["field_status"]
          updated_at?: string
          value: Json
        }
        Update: {
          confidence?: number | null
          deleted_at?: string | null
          field_key?: string
          id?: string
          pet_id?: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["field_source"]
          source_ref?: string | null
          status?: Database["public"]["Enums"]["field_status"]
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pet_profile_fields_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"]
          birth_date: string | null
          birth_date_is_approx: boolean
          breed: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_mixed_breed: boolean
          is_primary: boolean
          name: string
          notes: string | null
          owner_id: string
          photo_path: string | null
          reproductive_status: Database["public"]["Enums"]["reproductive_status"]
          sex: Database["public"]["Enums"]["pet_sex"]
          species: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          birth_date?: string | null
          birth_date_is_approx?: boolean
          breed?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_mixed_breed?: boolean
          is_primary?: boolean
          name: string
          notes?: string | null
          owner_id: string
          photo_path?: string | null
          reproductive_status?: Database["public"]["Enums"]["reproductive_status"]
          sex?: Database["public"]["Enums"]["pet_sex"]
          species?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          birth_date?: string | null
          birth_date_is_approx?: boolean
          breed?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_mixed_breed?: boolean
          is_primary?: boolean
          name?: string
          notes?: string | null
          owner_id?: string
          photo_path?: string | null
          reproductive_status?: Database["public"]["Enums"]["reproductive_status"]
          sex?: Database["public"]["Enums"]["pet_sex"]
          species?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          base_price_cents: number
          billing_period: string | null
          currency: string
          final_price_cents: number
          id: string
          kind: string
          paws: number | null
          sort_order: number
          title_key: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price_cents: number
          billing_period?: string | null
          currency?: string
          final_price_cents: number
          id: string
          kind: string
          paws?: number | null
          sort_order?: number
          title_key: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price_cents?: number
          billing_period?: string | null
          currency?: string
          final_price_cents?: number
          id?: string
          kind?: string
          paws?: number | null
          sort_order?: number
          title_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          locale: string
          onboarding_completed_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          onboarding_completed_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          onboarding_completed_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          all_day: boolean
          category: Database["public"]["Enums"]["reminder_category"]
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string
          id: string
          lead_minutes: number[]
          notes: string | null
          owner_id: string
          pet_id: string | null
          priority: Database["public"]["Enums"]["reminder_priority"]
          related_health_field_id: string | null
          repeat_frequency: string
          repeat_interval: number
          snoozed_until: string | null
          source: Database["public"]["Enums"]["reminder_source"]
          status: Database["public"]["Enums"]["reminder_status"]
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          category?: Database["public"]["Enums"]["reminder_category"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          lead_minutes?: number[]
          notes?: string | null
          owner_id: string
          pet_id?: string | null
          priority?: Database["public"]["Enums"]["reminder_priority"]
          related_health_field_id?: string | null
          repeat_frequency?: string
          repeat_interval?: number
          snoozed_until?: string | null
          source?: Database["public"]["Enums"]["reminder_source"]
          status?: Database["public"]["Enums"]["reminder_status"]
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          category?: Database["public"]["Enums"]["reminder_category"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          lead_minutes?: number[]
          notes?: string | null
          owner_id?: string
          pet_id?: string | null
          priority?: Database["public"]["Enums"]["reminder_priority"]
          related_health_field_id?: string | null
          repeat_frequency?: string
          repeat_interval?: number
          snoozed_until?: string | null
          source?: Database["public"]["Enums"]["reminder_source"]
          status?: Database["public"]["Enums"]["reminder_status"]
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_definitions: {
        Row: {
          activates_at: string | null
          active: boolean
          amount: number | null
          claim_mode: string
          created_at: string
          expires_at: string | null
          id: string
          is_provisional: boolean
          milestone_streak: number | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          title_key: string
        }
        Insert: {
          activates_at?: string | null
          active?: boolean
          amount?: number | null
          claim_mode?: string
          created_at?: string
          expires_at?: string | null
          id: string
          is_provisional?: boolean
          milestone_streak?: number | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          title_key: string
        }
        Update: {
          activates_at?: string | null
          active?: boolean
          amount?: number | null
          claim_mode?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_provisional?: boolean
          milestone_streak?: number | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          title_key?: string
        }
        Relationships: []
      }
      reward_grants: {
        Row: {
          claimed_at: string | null
          granted_at: string
          id: string
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          granted_at?: string
          id?: string
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          granted_at?: string
          id?: string
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_grants_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          best_count: number
          current_count: number
          last_completed_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_count?: number
          current_count?: number
          last_completed_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_count?: number
          current_count?: number
          last_completed_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_daily_activity: {
        Args: {
          p_activity_id: string
          p_dog_response?: string
          p_source?: string
        }
        Returns: {
          best_count: number
          current_count: number
          last_completed_date: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      credit_paws: {
        Args: {
          p_amount: number
          p_idempotency_key: string
          p_kind: Database["public"]["Enums"]["paw_tx_kind"]
          p_purchase_ref?: string
          p_reason: string
          p_user: string
        }
        Returns: {
          balance_after: number
          balance_before: number
          created_at: string
          delta: number
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["paw_tx_kind"]
          meta: Json | null
          operation: string | null
          purchase_ref: string | null
          reason: string
          related_entity: string | null
          status: Database["public"]["Enums"]["paw_tx_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "paw_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      spend_paws: {
        Args: {
          p_idempotency_key: string
          p_operation: string
          p_related_entity?: string
        }
        Returns: {
          balance_after: number
          balance_before: number
          created_at: string
          delta: number
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["paw_tx_kind"]
          meta: Json | null
          operation: string | null
          purchase_ref: string | null
          reason: string
          related_entity: string | null
          status: Database["public"]["Enums"]["paw_tx_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "paw_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_custom_topup: { Args: { p_paws: number }; Returns: number }
    }
    Enums: {
      activity_category:
        | "confidence"
        | "play"
        | "relax"
        | "calm"
        | "communication"
        | "cooperation"
      activity_level: "low" | "medium" | "high" | "unknown"
      activity_review_status:
        | "draft"
        | "pending_review"
        | "reviewed"
        | "blocked"
      field_source: "user" | "document" | "ai"
      field_status: "confirmed" | "pending" | "rejected"
      paw_tx_kind:
        | "purchase"
        | "reward"
        | "spend"
        | "refund"
        | "adjustment"
        | "subscription_grant"
      paw_tx_status: "completed" | "reversed"
      pet_sex: "male" | "female" | "unknown"
      plan_kind: "free" | "pro_monthly" | "pro_annual"
      reminder_category:
        | "vet_appointment"
        | "vaccine"
        | "deworming"
        | "medication"
        | "food_purchase"
        | "grooming"
        | "bath"
        | "training"
        | "activity"
        | "trip"
        | "walk"
        | "custom"
      reminder_priority: "low" | "normal" | "high"
      reminder_source: "manual" | "booklet"
      reminder_status: "pending" | "completed" | "snoozed" | "cancelled"
      reproductive_status: "intact" | "neutered" | "unknown"
      reward_type: "paws" | "badge" | "character_unlock" | "cosmetic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_category: [
        "confidence",
        "play",
        "relax",
        "calm",
        "communication",
        "cooperation",
      ],
      activity_level: ["low", "medium", "high", "unknown"],
      activity_review_status: [
        "draft",
        "pending_review",
        "reviewed",
        "blocked",
      ],
      field_source: ["user", "document", "ai"],
      field_status: ["confirmed", "pending", "rejected"],
      paw_tx_kind: [
        "purchase",
        "reward",
        "spend",
        "refund",
        "adjustment",
        "subscription_grant",
      ],
      paw_tx_status: ["completed", "reversed"],
      pet_sex: ["male", "female", "unknown"],
      plan_kind: ["free", "pro_monthly", "pro_annual"],
      reminder_category: [
        "vet_appointment",
        "vaccine",
        "deworming",
        "medication",
        "food_purchase",
        "grooming",
        "bath",
        "training",
        "activity",
        "trip",
        "walk",
        "custom",
      ],
      reminder_priority: ["low", "normal", "high"],
      reminder_source: ["manual", "booklet"],
      reminder_status: ["pending", "completed", "snoozed", "cancelled"],
      reproductive_status: ["intact", "neutered", "unknown"],
      reward_type: ["paws", "badge", "character_unlock", "cosmetic"],
    },
  },
} as const
