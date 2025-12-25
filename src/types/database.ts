export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          locale: string;
          theme: string;
          points: number;
          badges: Json;
          streak_days: number;
          last_active_date: string | null;
          preferences: Json;
          subscription_tier: string;
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          theme?: string;
          points?: number;
          badges?: Json;
          streak_days?: number;
          last_active_date?: string | null;
          preferences?: Json;
          subscription_tier?: string;
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          theme?: string;
          points?: number;
          badges?: Json;
          streak_days?: number;
          last_active_date?: string | null;
          preferences?: Json;
          subscription_tier?: string;
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      designs: {
        Row: {
          id: string;
          user_id: string | null;
          surah_number: number;
          ayah_start: number;
          ayah_end: number;
          verse_text: string;
          customization: Json;
          ai_suggestions: Json | null;
          is_public: boolean;
          is_featured: boolean;
          views_count: number;
          likes_count: number;
          shares_count: number;
          exports_count: number;
          title: string | null;
          description: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          surah_number: number;
          ayah_start: number;
          ayah_end: number;
          verse_text: string;
          customization?: Json;
          ai_suggestions?: Json | null;
          is_public?: boolean;
          is_featured?: boolean;
          views_count?: number;
          likes_count?: number;
          shares_count?: number;
          exports_count?: number;
          title?: string | null;
          description?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          surah_number?: number;
          ayah_start?: number;
          ayah_end?: number;
          verse_text?: string;
          customization?: Json;
          ai_suggestions?: Json | null;
          is_public?: boolean;
          is_featured?: boolean;
          views_count?: number;
          likes_count?: number;
          shares_count?: number;
          exports_count?: number;
          title?: string | null;
          description?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_design_id: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_design_id?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          cover_design_id?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          design_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          design_id: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          design_id?: string;
          position?: number;
          added_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          design_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          design_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          design_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Design = Database["public"]["Tables"]["designs"]["Row"];
export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type CollectionItem = Database["public"]["Tables"]["collection_items"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];

