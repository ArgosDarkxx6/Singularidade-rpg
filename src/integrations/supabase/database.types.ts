export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string;
          avatar_path: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string;
          avatar_path?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      tables: {
        Row: {
          id: string;
          slug: string;
          name: string;
          series_name: string;
          campaign_name: string;
          episode_number: string;
          episode_title: string;
          session_date: string | null;
          location: string;
          status: string;
          expected_roster: string;
          recap: string;
          objective: string;
          meta: Json;
          state: Json;
          owner_id: string | null;
          current_round: number;
          current_turn_index: number;
          last_editor: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          series_name?: string;
          campaign_name?: string;
          episode_number?: string;
          episode_title?: string;
          session_date?: string | null;
          location?: string;
          status?: string;
          expected_roster?: string;
          recap?: string;
          objective?: string;
          meta?: Json;
          state?: Json;
          owner_id?: string | null;
          current_round?: number;
          current_turn_index?: number;
          last_editor?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tables']['Insert']>;
        Relationships: [];
      };
      table_memberships: {
        Row: {
          id: string;
          table_id: string;
          user_id: string;
          role: string;
          character_id: string | null;
          nickname: string;
          active: boolean;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          user_id: string;
          role?: string;
          character_id?: string | null;
          nickname?: string;
          active?: boolean;
          joined_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['table_memberships']['Insert']>;
        Relationships: [];
      };
      table_invites: {
        Row: {
          id: string;
          table_id: string;
          created_by: string | null;
          token: string;
          role: string;
          character_id: string | null;
          label: string;
          expires_at: string | null;
          revoked_at: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          created_by?: string | null;
          token: string;
          role?: string;
          character_id?: string | null;
          label?: string;
          expires_at?: string | null;
          revoked_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['table_invites']['Insert']>;
        Relationships: [];
      };
      table_join_codes: {
        Row: {
          id: string;
          table_id: string;
          created_by: string | null;
          code: string;
          role: string;
          character_id: string | null;
          label: string;
          active: boolean;
          expires_at: string | null;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          created_by?: string | null;
          code: string;
          role?: string;
          character_id?: string | null;
          label?: string;
          active?: boolean;
          expires_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['table_join_codes']['Insert']>;
        Relationships: [];
      };
      table_snapshots: {
        Row: {
          id: string;
          table_id: string;
          created_by: string | null;
          label: string;
          state: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          created_by?: string | null;
          label?: string;
          state?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['table_snapshots']['Insert']>;
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          table_id: string;
          owner_id: string | null;
          name: string;
          age: number;
          clan: string;
          grade: string;
          appearance: string;
          identity_scar: string;
          identity_anchor: string;
          identity_trigger: string;
          avatar_url: string;
          avatar_path: string;
          archived: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          owner_id?: string | null;
          name: string;
          age?: number;
          clan?: string;
          grade?: string;
          appearance?: string;
          identity_scar?: string;
          identity_anchor?: string;
          identity_trigger?: string;
          avatar_url?: string;
          avatar_path?: string;
          archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['characters']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_table_invite: {
        Args: { invite_token: string };
        Returns: {
          table_id: string;
          table_slug: string;
          table_name: string;
          membership_id: string;
          role: string;
          character_id: string | null;
        }[];
      };
      claim_table_invite_v2: {
        Args: { invite_token: string; session_nickname?: string | null };
        Returns: {
          table_id: string;
          table_slug: string;
          table_name: string;
          membership_id: string;
          role: string;
          character_id: string | null;
        }[];
      };
      claim_join_code: {
        Args: { join_code: string };
        Returns: {
          table_id: string;
          table_slug: string;
          table_name: string;
          membership_id: string;
          role: string;
          character_id: string | null;
        }[];
      };
      claim_join_code_v2: {
        Args: { join_code: string; session_nickname?: string | null; selected_character_id?: string | null };
        Returns: {
          table_id: string;
          table_slug: string;
          table_name: string;
          membership_id: string;
          role: string;
          character_id: string | null;
        }[];
      };
      resolve_join_code: {
        Args: { join_code: string };
        Returns: {
          table_id: string;
          table_slug: string;
          table_name: string;
          role: string;
          character_id: string | null;
          requires_character: boolean;
          characters: Json;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
