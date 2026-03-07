export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_rules: {
        Row: {
          active: boolean | null
          channel: string
          competitor_id: string | null
          created_at: string | null
          id: string
          min_importance: number | null
          signal_type: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          channel?: string
          competitor_id?: string | null
          created_at?: string | null
          id?: string
          min_importance?: number | null
          signal_type?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          channel?: string
          competitor_id?: string | null
          created_at?: string | null
          id?: string
          min_importance?: number | null
          signal_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing: {
        Row: {
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_metrics: {
        Row: {
          activity_score: number | null
          avg_importance: number | null
          competitor_id: string
          date: string
          signal_count: number | null
        }
        Insert: {
          activity_score?: number | null
          avg_importance?: number | null
          competitor_id: string
          date: string
          signal_count?: number | null
        }
        Update: {
          activity_score?: number | null
          avg_importance?: number | null
          competitor_id?: string
          date?: string
          signal_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_metrics_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          created_at: string | null
          description: string | null
          github_handle: string | null
          id: string
          last_scraped_at: string | null
          logo_url: string | null
          name: string
          product_hunt_slug: string | null
          twitter_handle: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          github_handle?: string | null
          id?: string
          last_scraped_at?: string | null
          logo_url?: string | null
          name: string
          product_hunt_slug?: string | null
          twitter_handle?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          github_handle?: string | null
          id?: string
          last_scraped_at?: string | null
          logo_url?: string | null
          name?: string
          product_hunt_slug?: string | null
          twitter_handle?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      digest_signals: {
        Row: {
          digest_id: string
          signal_id: string
        }
        Insert: {
          digest_id: string
          signal_id: string
        }
        Update: {
          digest_id?: string
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digest_signals_digest_id_fkey"
            columns: ["digest_id"]
            isOneToOne: false
            referencedRelation: "digests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digest_signals_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      digests: {
        Row: {
          emailed: boolean | null
          executive_summary: string | null
          generated_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          read: boolean | null
          strategic_insights: Json | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          emailed?: boolean | null
          executive_summary?: string | null
          generated_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          read?: boolean | null
          strategic_insights?: Json | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          emailed?: boolean | null
          executive_summary?: string | null
          generated_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          read?: boolean | null
          strategic_insights?: Json | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      scrape_errors: {
        Row: {
          competitor_id: string | null
          error: string | null
          failed_at: string | null
          id: string
        }
        Insert: {
          competitor_id?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
        }
        Update: {
          competitor_id?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_errors_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_embeddings: {
        Row: {
          competitor_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          model: string | null
          signal_id: string | null
        }
        Insert: {
          competitor_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          model?: string | null
          signal_id?: string | null
        }
        Update: {
          competitor_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          model?: string | null
          signal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_embeddings_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signal_embeddings_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          competitor_id: string | null
          detected_at: string | null
          id: string
          importance_score: number | null
          nia_indexed: boolean | null
          raw_content: string | null
          raw_source: string | null
          signal_type: string
          source: string
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          competitor_id?: string | null
          detected_at?: string | null
          id?: string
          importance_score?: number | null
          nia_indexed?: boolean | null
          raw_content?: string | null
          raw_source?: string | null
          signal_type: string
          source: string
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          competitor_id?: string | null
          detected_at?: string | null
          id?: string
          importance_score?: number | null
          nia_indexed?: boolean | null
          raw_content?: string | null
          raw_source?: string | null
          signal_type?: string
          source?: string
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key_features: string[] | null
          name: string
          positioning: string | null
          target_market: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key_features?: string[] | null
          name: string
          positioning?: string | null
          target_market?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key_features?: string[] | null
          name?: string
          positioning?: string | null
          target_market?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_snapshots: {
        Row: {
          captured_at: string | null
          competitor_id: string | null
          content_hash: string | null
          id: string
          raw_content: string | null
          url: string
        }
        Insert: {
          captured_at?: string | null
          competitor_id?: string | null
          content_hash?: string | null
          id?: string
          raw_content?: string | null
          url: string
        }
        Update: {
          captured_at?: string | null
          competitor_id?: string | null
          content_hash?: string | null
          id?: string
          raw_content?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_snapshots_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

