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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      character_attributes: {
        Row: {
          attribute_key: string
          character_id: string
          created_at: string
          rank: string
          sort_order: number
          updated_at: string
          value: number
        }
        Insert: {
          attribute_key: string
          character_id: string
          created_at?: string
          rank?: string
          sort_order?: number
          updated_at?: string
          value?: number
        }
        Update: {
          attribute_key?: string
          character_id?: string
          created_at?: string
          rank?: string
          sort_order?: number
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_attributes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_conditions: {
        Row: {
          character_id: string
          color: string
          created_at: string
          id: string
          name: string
          note: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          character_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          note?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          character_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          note?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_conditions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_cores: {
        Row: {
          age: number
          appearance: string
          avatar_path: string
          avatar_url: string
          clan: string
          created_at: string
          grade: string
          id: string
          lore: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          age?: number
          appearance?: string
          avatar_path?: string
          avatar_url?: string
          clan?: string
          created_at?: string
          grade?: string
          id?: string
          lore?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          age?: number
          appearance?: string
          avatar_path?: string
          avatar_url?: string
          clan?: string
          created_at?: string
          grade?: string
          id?: string
          lore?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_cores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      character_gallery_images: {
        Row: {
          caption: string
          character_id: string
          created_at: string
          id: string
          image_path: string
          image_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          caption?: string
          character_id: string
          created_at?: string
          id?: string
          image_path?: string
          image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          caption?: string
          character_id?: string
          created_at?: string
          id?: string
          image_path?: string
          image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_gallery_images_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_inventory_items: {
        Row: {
          character_id: string
          created_at: string
          effect: string
          id: string
          name: string
          quantity: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          effect?: string
          id?: string
          name: string
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          effect?: string
          id?: string
          name?: string
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_inventory_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_passives: {
        Row: {
          character_id: string
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_passives_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_resources: {
        Row: {
          character_id: string
          created_at: string
          current_value: number
          max_value: number
          resource_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          current_value?: number
          max_value?: number
          resource_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          current_value?: number
          max_value?: number
          resource_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_resources_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_techniques: {
        Row: {
          character_id: string
          cost: number
          created_at: string
          damage: string
          description: string
          id: string
          name: string
          sort_order: number
          tags: string[]
          technique_type: string
          updated_at: string
        }
        Insert: {
          character_id: string
          cost?: number
          created_at?: string
          damage?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
          tags?: string[]
          technique_type?: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          cost?: number
          created_at?: string
          damage?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
          tags?: string[]
          technique_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_techniques_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_vows: {
        Row: {
          benefit: string
          character_id: string
          created_at: string
          id: string
          name: string
          penalty: string
          restriction: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          benefit?: string
          character_id: string
          created_at?: string
          id?: string
          name: string
          penalty?: string
          restriction?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          benefit?: string
          character_id?: string
          created_at?: string
          id?: string
          name?: string
          penalty?: string
          restriction?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_vows_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_weapons: {
        Row: {
          character_id: string
          created_at: string
          damage: string
          description: string
          grade: string
          id: string
          name: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          damage?: string
          description?: string
          grade?: string
          id?: string
          name: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          damage?: string
          description?: string
          grade?: string
          id?: string
          name?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_weapons_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number
          appearance: string
          archived: boolean
          avatar_path: string
          avatar_url: string
          clan: string
          created_at: string
          core_id: string | null
          grade: string
          id: string
          identity_anchor: string
          lore: string
          identity_scar: string
          identity_trigger: string
          money: number
          name: string
          owner_id: string | null
          sort_order: number
          table_id: string | null
          updated_at: string
        }
        Insert: {
          age?: number
          appearance?: string
          archived?: boolean
          avatar_path?: string
          avatar_url?: string
          clan?: string
          created_at?: string
          core_id?: string | null
          grade?: string
          id?: string
          identity_anchor?: string
          lore?: string
          identity_scar?: string
          identity_trigger?: string
          money?: number
          name: string
          owner_id?: string | null
          sort_order?: number
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          appearance?: string
          archived?: boolean
          avatar_path?: string
          avatar_url?: string
          clan?: string
          created_at?: string
          core_id?: string | null
          grade?: string
          id?: string
          identity_anchor?: string
          lore?: string
          identity_scar?: string
          identity_trigger?: string
          money?: number
          name?: string
          owner_id?: string | null
          sort_order?: number
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_core_id_fkey"
            columns: ["core_id"]
            isOneToOne: false
            referencedRelation: "character_cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      order_entries: {
        Row: {
          character_id: string | null
          created_at: string
          entry_type: string
          id: string
          initiative: number | null
          modifier: number
          name: string
          notes: string
          sort_order: number
          table_id: string
          updated_at: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          initiative?: number | null
          modifier?: number
          name: string
          notes?: string
          sort_order?: number
          table_id: string
          updated_at?: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          initiative?: number | null
          modifier?: number
          name?: string
          notes?: string
          sort_order?: number
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_entries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_entries_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          email: string
          id: string
          is_public: boolean
          updated_at: string
          username: string
        }
        Insert: {
          avatar_path?: string
          avatar_url?: string
          bio?: string
          created_at?: string
          display_name?: string
          email: string
          id: string
          is_public?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          avatar_path?: string
          avatar_url?: string
          bio?: string
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_public?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      table_invites: {
        Row: {
          accepted_at: string | null
          character_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          kind: string
          label: string
          revoked_at: string | null
          role: string
          table_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          label?: string
          revoked_at?: string | null
          role?: string
          table_id: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          label?: string
          revoked_at?: string | null
          role?: string
          table_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_invites_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_invites_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_join_codes: {
        Row: {
          active: boolean
          character_id: string | null
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          kind: string
          label: string
          last_used_at: string | null
          role: string
          table_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          character_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          label?: string
          last_used_at?: string | null
          role?: string
          table_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          character_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          label?: string
          last_used_at?: string | null
          role?: string
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_join_codes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_join_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_join_codes_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_characters: {
        Row: {
          character_id: string
          core_id: string
          created_at: string
          id: string
          owner_id: string | null
          table_id: string
          updated_at: string
        }
        Insert: {
          character_id: string
          core_id: string
          created_at?: string
          id?: string
          owner_id?: string | null
          table_id: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          core_id?: string
          created_at?: string
          id?: string
          owner_id?: string | null
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_characters_core_id_fkey"
            columns: ["core_id"]
            isOneToOne: false
            referencedRelation: "character_cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_characters_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_characters_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_logs: {
        Row: {
          actor_id: string | null
          actor_membership_id: string | null
          body: string
          category: string
          character_id: string | null
          created_at: string
          event_kind: string
          id: string
          meta: string
          payload: Json
          table_id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          actor_membership_id?: string | null
          body?: string
          category?: string
          character_id?: string | null
          created_at?: string
          event_kind?: string
          id?: string
          meta?: string
          payload?: Json
          table_id: string
          title?: string
        }
        Update: {
          actor_id?: string | null
          actor_membership_id?: string | null
          body?: string
          category?: string
          character_id?: string | null
          created_at?: string
          event_kind?: string
          id?: string
          meta?: string
          payload?: Json
          table_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_logs_actor_membership_id_fkey"
            columns: ["actor_membership_id"]
            isOneToOne: false
            referencedRelation: "table_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_logs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_logs_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_memberships: {
        Row: {
          active: boolean
          character_id: string | null
          id: string
          joined_at: string
          nickname: string
          role: string
          table_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          character_id?: string | null
          id?: string
          joined_at?: string
          nickname?: string
          role?: string
          table_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          character_id?: string | null
          id?: string
          joined_at?: string
          nickname?: string
          role?: string
          table_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_memberships_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_memberships_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      table_session_attendances: {
        Row: {
          created_at: string
          id: string
          marked_at: string
          membership_id: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marked_at?: string
          membership_id: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marked_at?: string
          membership_id?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_session_attendances_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "table_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_session_attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          episode_number: string
          episode_title: string
          id: string
          is_active: boolean
          location: string
          notes: string
          objective: string
          recap: string
          session_date: string | null
          status: string
          table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          episode_number?: string
          episode_title?: string
          id?: string
          is_active?: boolean
          location?: string
          notes?: string
          objective?: string
          recap?: string
          session_date?: string | null
          status?: string
          table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          episode_number?: string
          episode_title?: string
          id?: string
          is_active?: boolean
          location?: string
          notes?: string
          objective?: string
          recap?: string
          session_date?: string | null
          status?: string
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          state: Json
          table_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          state?: Json
          table_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          state?: Json
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_snapshots_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          campaign_name: string
          created_at: string
          current_round: number
          current_session_id: string | null
          current_turn_index: number
          description: string
          episode_number: string
          episode_title: string
          expected_roster: string
          id: string
          last_editor: string
          location: string
          meta: Json
          name: string
          objective: string
          owner_id: string | null
          recap: string
          series_name: string
          session_date: string | null
          slot_count: number
          slug: string
          state: Json
          status: string
          system_key: string
          updated_at: string
        }
        Insert: {
          campaign_name?: string
          created_at?: string
          current_round?: number
          current_session_id?: string | null
          current_turn_index?: number
          description?: string
          episode_number?: string
          episode_title?: string
          expected_roster?: string
          id?: string
          last_editor?: string
          location?: string
          meta?: Json
          name: string
          objective?: string
          owner_id?: string | null
          recap?: string
          series_name?: string
          session_date?: string | null
          slot_count?: number
          slug: string
          state?: Json
          status?: string
          system_key?: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          created_at?: string
          current_round?: number
          current_session_id?: string | null
          current_turn_index?: number
          description?: string
          episode_number?: string
          episode_title?: string
          expected_roster?: string
          id?: string
          last_editor?: string
          location?: string
          meta?: Json
          name?: string
          objective?: string
          owner_id?: string | null
          recap?: string
          series_name?: string
          session_date?: string | null
          slot_count?: number
          slug?: string
          state?: Json
          status?: string
          system_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_current_session_id_fkey"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_character_resource_current: {
        Args: {
          p_character_id: string
          p_delta: number
          p_resource_key: string
          p_table_id: string
        }
        Returns: {
          character_id: string
          current_value: number
          max_value: number
          resource_key: string
          updated_at: string
        }[]
      }
      can_manage_character: { Args: { character_id: string }; Returns: boolean }
      can_manage_session: { Args: { session_id: string }; Returns: boolean }
      can_manage_table: { Args: { table_id: string }; Returns: boolean }
      can_play_table: { Args: { table_id: string }; Returns: boolean }
      can_view_character: { Args: { character_id: string }; Returns: boolean }
      can_view_session: { Args: { session_id: string }; Returns: boolean }
      is_username_available: { Args: { input: string }; Returns: boolean }
      claim_join_code: {
        Args: { join_code: string }
        Returns: {
          character_id: string
          membership_id: string
          role: string
          system_key: string
          table_id: string
          table_name: string
          table_slug: string
        }[]
      }
      claim_join_code_v2: {
        Args: {
          join_code: string
          selected_character_id?: string
          session_nickname?: string
        }
        Returns: {
          character_id: string
          membership_id: string
          role: string
          system_key: string
          table_id: string
          table_name: string
          table_slug: string
        }[]
      }
      claim_table_invite: {
        Args: { invite_token: string }
        Returns: {
          character_id: string
          membership_id: string
          role: string
          system_key: string
          table_id: string
          table_name: string
          table_slug: string
        }[]
      }
      claim_table_invite_v2: {
        Args: { invite_token: string; session_nickname?: string }
        Returns: {
          character_id: string
          membership_id: string
          role: string
          system_key: string
          table_id: string
          table_name: string
          table_slug: string
        }[]
      }
      delete_table_preserving_characters: {
        Args: { p_table_id: string }
        Returns: undefined
      }
      is_table_gm: { Args: { table_id: string }; Returns: boolean }
      is_table_member: { Args: { table_id: string }; Returns: boolean }
      leave_table: { Args: { p_table_id: string }; Returns: undefined }
      normalize_username: { Args: { input: string }; Returns: string }
      record_table_roll_event: {
        Args: {
          p_body: string
          p_category?: string
          p_character_id: string
          p_meta?: string
          p_payload?: Json
          p_table_id: string
          p_title: string
        }
        Returns: {
          created_at: string
          log_id: string
        }[]
      }
      resolve_join_code: {
        Args: { join_code: string }
        Returns: {
          character_id: string
          characters: Json
          requires_character: boolean
          role: string
          system_key: string
          table_id: string
          table_name: string
          table_slug: string
        }[]
      }
      slugify_text: { Args: { input: string }; Returns: string }
      transfer_table_ownership: {
        Args: { p_table_id: string; p_target_membership_id: string }
        Returns: undefined
      }
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
