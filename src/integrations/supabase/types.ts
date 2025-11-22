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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          attendees: string[] | null
          community_id: string
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          notification_enabled: boolean | null
          notification_time: number | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attendees?: string[] | null
          community_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type: string
          id?: string
          location?: string | null
          notification_enabled?: boolean | null
          notification_time?: number | null
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attendees?: string[] | null
          community_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          notification_enabled?: boolean | null
          notification_time?: number | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_invitations: {
        Row: {
          community_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string | null
          status: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string | null
          status?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_invitations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          instagram_url: string | null
          instrument: string | null
          location: string | null
          ministry_role: string | null
          phone: string | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          instagram_url?: string | null
          instrument?: string | null
          location?: string | null
          ministry_role?: string | null
          phone?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          instrument?: string | null
          location?: string | null
          ministry_role?: string | null
          phone?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      service_sets: {
        Row: {
          band_name: string | null
          community_id: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          is_public: boolean | null
          notes: string | null
          scripture_reference: string | null
          service_name: string
          status: Database["public"]["Enums"]["set_status"]
          target_audience: string | null
          theme: string | null
          updated_at: string
          worship_duration: number | null
          worship_leader: string | null
        }
        Insert: {
          band_name?: string | null
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          is_public?: boolean | null
          notes?: string | null
          scripture_reference?: string | null
          service_name: string
          status?: Database["public"]["Enums"]["set_status"]
          target_audience?: string | null
          theme?: string | null
          updated_at?: string
          worship_duration?: number | null
          worship_leader?: string | null
        }
        Update: {
          band_name?: string | null
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          is_public?: boolean | null
          notes?: string | null
          scripture_reference?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["set_status"]
          target_audience?: string | null
          theme?: string | null
          updated_at?: string
          worship_duration?: number | null
          worship_leader?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_sets_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      set_collaborators: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["collaborator_role"]
          service_set_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["collaborator_role"]
          service_set_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["collaborator_role"]
          service_set_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_collaborators_service_set_id_fkey"
            columns: ["service_set_id"]
            isOneToOne: false
            referencedRelation: "service_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          service_set_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          service_set_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          service_set_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_comments_service_set_id_fkey"
            columns: ["service_set_id"]
            isOneToOne: false
            referencedRelation: "service_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      set_songs: {
        Row: {
          bpm: number | null
          created_at: string
          custom_notes: string | null
          energy_level: number | null
          id: string
          key: string | null
          override_score_file_url: string | null
          override_youtube_url: string | null
          position: number
          service_set_id: string
          song_id: string
          time_signature: string | null
        }
        Insert: {
          bpm?: number | null
          created_at?: string
          custom_notes?: string | null
          energy_level?: number | null
          id?: string
          key?: string | null
          override_score_file_url?: string | null
          override_youtube_url?: string | null
          position: number
          service_set_id: string
          song_id: string
          time_signature?: string | null
        }
        Update: {
          bpm?: number | null
          created_at?: string
          custom_notes?: string | null
          energy_level?: number | null
          id?: string
          key?: string | null
          override_score_file_url?: string | null
          override_youtube_url?: string | null
          position?: number
          service_set_id?: string
          song_id?: string
          time_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "set_songs_service_set_id_fkey"
            columns: ["service_set_id"]
            isOneToOne: false
            referencedRelation: "service_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_scores: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          key: string
          page_number: number | null
          position: number | null
          song_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          key: string
          page_number?: number | null
          position?: number | null
          song_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          key?: string
          page_number?: number | null
          position?: number | null
          song_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_scores_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist: string | null
          category: string | null
          created_at: string
          default_key: string | null
          id: string
          interpretation: string | null
          language: string | null
          notes: string | null
          score_file_url: string | null
          subtitle: string | null
          tags: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          artist?: string | null
          category?: string | null
          created_at?: string
          default_key?: string | null
          id?: string
          interpretation?: string | null
          language?: string | null
          notes?: string | null
          score_file_url?: string | null
          subtitle?: string | null
          tags?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          artist?: string | null
          category?: string | null
          created_at?: string
          default_key?: string | null
          id?: string
          interpretation?: string | null
          language?: string | null
          notes?: string | null
          score_file_url?: string | null
          subtitle?: string | null
          tags?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          church_name: string | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          k_spirit_meaning: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          church_name?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          k_spirit_meaning?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          church_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          k_spirit_meaning?: string | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      worship_communities: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          invite_token: string
          is_active: boolean | null
          leader_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invite_token?: string
          is_active?: boolean | null
          leader_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invite_token?: string
          is_active?: boolean | null
          leader_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_community_leader: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_set_collaborator: {
        Args: { _set_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "worship_leader" | "user"
      collaborator_role: "editor" | "viewer"
      set_status: "draft" | "published"
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
      app_role: ["admin", "worship_leader", "user"],
      collaborator_role: ["editor", "viewer"],
      set_status: ["draft", "published"],
    },
  },
} as const
