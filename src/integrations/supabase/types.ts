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
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: string[] | null
          community_id: string
          created_at: string | null
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      church_account_members: {
        Row: {
          church_account_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          church_account_id: string
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          church_account_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_account_members_church_account_id_fkey"
            columns: ["church_account_id"]
            isOneToOne: false
            referencedRelation: "church_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_account_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_accounts: {
        Row: {
          billing_email: string | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          domain_status: string | null
          domain_verified_at: string | null
          id: string
          logo_url: string | null
          max_seats: number
          name: string
          owner_id: string
          slogan: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          theme_config: Json | null
          trial_ends_at: string | null
          updated_at: string | null
          used_seats: number
          website: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          id?: string
          logo_url?: string | null
          max_seats?: number
          name: string
          owner_id: string
          slogan?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          theme_config?: Json | null
          trial_ends_at?: string | null
          updated_at?: string | null
          used_seats?: number
          website?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          id?: string
          logo_url?: string | null
          max_seats?: number
          name?: string
          owner_id?: string
          slogan?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          theme_config?: Json | null
          trial_ends_at?: string | null
          updated_at?: string | null
          used_seats?: number
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_custom_roles: {
        Row: {
          church_account_id: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          name_ko: string | null
          permission_level: string | null
          position: number | null
          updated_at: string | null
        }
        Insert: {
          church_account_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ko?: string | null
          permission_level?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          church_account_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ko?: string | null
          permission_level?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_custom_roles_church_account_id_fkey"
            columns: ["church_account_id"]
            isOneToOne: false
            referencedRelation: "church_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      church_role_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          community_id: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          community_id: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          community_id?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_role_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_role_assignments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "church_custom_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_role_communities: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          role_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          role_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_role_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_role_communities_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "church_custom_roles"
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
      community_join_requests: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_join_requests_community_id_fkey"
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
      community_posts: {
        Row: {
          author_id: string | null
          community_id: string
          content: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          community_id: string
          content: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          community_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          post_type: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          post_type?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          post_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      liturgical_calendar_items: {
        Row: {
          created_at: string
          date_end: string
          date_start: string
          id: string
          title_en: string | null
          title_ko: string
          type: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          date_end: string
          date_start: string
          id?: string
          title_en?: string | null
          title_ko: string
          type?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          date_end?: string
          date_start?: string
          id?: string
          title_en?: string | null
          title_ko?: string
          type?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean
          key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          post_id: string
          post_type: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          post_type: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          post_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          post_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          post_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          post_type?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          church_name: string | null
          church_website: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          instagram_url: string | null
          instrument: string | null
          location: string | null
          ministry_role: string | null
          needs_worship_leader_profile: boolean | null
          phone: string | null
          serving_position: string | null
          timezone: string | null
          updated_at: string | null
          worship_leader_intro: string | null
          years_serving: number | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          church_name?: string | null
          church_website?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          instagram_url?: string | null
          instrument?: string | null
          location?: string | null
          ministry_role?: string | null
          needs_worship_leader_profile?: boolean | null
          phone?: string | null
          serving_position?: string | null
          timezone?: string | null
          updated_at?: string | null
          worship_leader_intro?: string | null
          years_serving?: number | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          church_name?: string | null
          church_website?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          instrument?: string | null
          location?: string | null
          ministry_role?: string | null
          needs_worship_leader_profile?: boolean | null
          phone?: string | null
          serving_position?: string | null
          timezone?: string | null
          updated_at?: string | null
          worship_leader_intro?: string | null
          years_serving?: number | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      recurring_schedules: {
        Row: {
          create_at_time: string | null
          create_days_before: number | null
          created_at: string | null
          day_of_month: number | null
          days_of_week: number[] | null
          end_date: string | null
          id: string
          interval_value: number | null
          is_active: boolean | null
          last_generated_date: string | null
          next_generation_date: string | null
          nth_weekday: number | null
          occurrence_count: number | null
          pattern: string
          start_date: string
          template_id: string
          updated_at: string | null
          weekday_for_nth: number | null
        }
        Insert: {
          create_at_time?: string | null
          create_days_before?: number | null
          created_at?: string | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          id?: string
          interval_value?: number | null
          is_active?: boolean | null
          last_generated_date?: string | null
          next_generation_date?: string | null
          nth_weekday?: number | null
          occurrence_count?: number | null
          pattern: string
          start_date: string
          template_id: string
          updated_at?: string | null
          weekday_for_nth?: number | null
        }
        Update: {
          create_at_time?: string | null
          create_days_before?: number | null
          created_at?: string | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          id?: string
          interval_value?: number | null
          is_active?: boolean | null
          last_generated_date?: string | null
          next_generation_date?: string | null
          nth_weekday?: number | null
          occurrence_count?: number | null
          pattern?: string
          start_date?: string
          template_id?: string
          updated_at?: string | null
          weekday_for_nth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "worship_set_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_achievements: {
        Row: {
          achievement_type: Database["public"]["Enums"]["seed_activity_type"]
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_type: Database["public"]["Enums"]["seed_activity_type"]
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_type?: Database["public"]["Enums"]["seed_activity_type"]
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      seed_daily_caps: {
        Row: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["seed_activity_type"]
          count: number
          id: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: Database["public"]["Enums"]["seed_activity_type"]
          count?: number
          id?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["seed_activity_type"]
          count?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      seed_levels: {
        Row: {
          badge_color: string
          created_at: string | null
          emoji: string
          id: number
          level: number
          max_seeds: number | null
          min_seeds: number
          name_en: string
          name_ko: string
        }
        Insert: {
          badge_color: string
          created_at?: string | null
          emoji: string
          id?: number
          level: number
          max_seeds?: number | null
          min_seeds: number
          name_en: string
          name_ko: string
        }
        Update: {
          badge_color?: string
          created_at?: string | null
          emoji?: string
          id?: number
          level?: number
          max_seeds?: number | null
          min_seeds?: number
          name_en?: string
          name_ko?: string
        }
        Relationships: []
      }
      seed_transactions: {
        Row: {
          activity_type: Database["public"]["Enums"]["seed_activity_type"]
          created_at: string | null
          description: string | null
          id: string
          related_id: string | null
          seeds_earned: number
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["seed_activity_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          related_id?: string | null
          seeds_earned: number
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["seed_activity_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          related_id?: string | null
          seeds_earned?: number
          user_id?: string
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
          public_share_enabled: boolean | null
          public_share_token: string | null
          scripture_reference: string | null
          service_name: string
          service_time: string | null
          status: Database["public"]["Enums"]["set_status"]
          target_audience: string | null
          theme: string | null
          updated_at: string
          view_count: number | null
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
          public_share_enabled?: boolean | null
          public_share_token?: string | null
          scripture_reference?: string | null
          service_name: string
          service_time?: string | null
          status?: Database["public"]["Enums"]["set_status"]
          target_audience?: string | null
          theme?: string | null
          updated_at?: string
          view_count?: number | null
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
          public_share_enabled?: boolean | null
          public_share_token?: string | null
          scripture_reference?: string | null
          service_name?: string
          service_time?: string | null
          status?: Database["public"]["Enums"]["set_status"]
          target_audience?: string | null
          theme?: string | null
          updated_at?: string
          view_count?: number | null
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
      service_sets_audit: {
        Row: {
          action: string
          changed_fields: Json | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          service_set_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          service_set_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          service_set_id?: string
          user_id?: string | null
        }
        Relationships: []
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
      set_components: {
        Row: {
          assigned_to: string | null
          component_type: string
          content: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          label: string
          notes: string | null
          position: number
          service_set_id: string
        }
        Insert: {
          assigned_to?: string | null
          component_type: string
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          label: string
          notes?: string | null
          position: number
          service_set_id: string
        }
        Update: {
          assigned_to?: string | null
          component_type?: string
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          label?: string
          notes?: string | null
          position?: number
          service_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_components_service_set_id_fkey"
            columns: ["service_set_id"]
            isOneToOne: false
            referencedRelation: "service_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      set_components_audit: {
        Row: {
          action: string
          changed_fields: Json | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          service_set_id: string
          set_component_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          service_set_id: string
          set_component_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          service_set_id?: string
          set_component_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      set_edit_locks: {
        Row: {
          acquired_at: string
          created_at: string
          expires_at: string
          holder_name: string
          holder_session_id: string
          holder_user_id: string
          id: string
          last_activity_at: string
          set_id: string
          takeover_requested_at: string | null
          takeover_requested_by: string | null
          takeover_requester_name: string | null
        }
        Insert: {
          acquired_at?: string
          created_at?: string
          expires_at?: string
          holder_name: string
          holder_session_id: string
          holder_user_id: string
          id?: string
          last_activity_at?: string
          set_id: string
          takeover_requested_at?: string | null
          takeover_requested_by?: string | null
          takeover_requester_name?: string | null
        }
        Update: {
          acquired_at?: string
          created_at?: string
          expires_at?: string
          holder_name?: string
          holder_session_id?: string
          holder_user_id?: string
          id?: string
          last_activity_at?: string
          set_id?: string
          takeover_requested_at?: string | null
          takeover_requested_by?: string | null
          takeover_requester_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "set_edit_locks_holder_user_id_fkey"
            columns: ["holder_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_edit_locks_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: true
            referencedRelation: "service_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_edit_locks_takeover_requested_by_fkey"
            columns: ["takeover_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          key_change_to: string | null
          lyrics: string | null
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
          key_change_to?: string | null
          lyrics?: string | null
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
          key_change_to?: string | null
          lyrics?: string | null
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
      set_songs_audit: {
        Row: {
          action: string
          changed_fields: Json | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          service_set_id: string
          set_song_id: string
          song_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          service_set_id: string
          set_song_id: string
          song_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          service_set_id?: string
          set_song_id?: string
          song_id?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      song_youtube_links: {
        Row: {
          created_at: string | null
          id: string
          label: string
          position: number | null
          song_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          position?: number | null
          song_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          position?: number | null
          song_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_youtube_links_song_id_fkey"
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
          created_by: string | null
          default_key: string | null
          id: string
          interpretation: string | null
          language: string | null
          lyrics: string | null
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
          created_by?: string | null
          default_key?: string | null
          id?: string
          interpretation?: string | null
          language?: string | null
          lyrics?: string | null
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
          created_by?: string | null
          default_key?: string | null
          id?: string
          interpretation?: string | null
          language?: string | null
          lyrics?: string | null
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
      songs_audit: {
        Row: {
          action: string
          changed_fields: Json | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          song_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          song_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          song_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_rotation_assignments: {
        Row: {
          assigned_date: string
          created_at: string | null
          id: string
          rotation_index: number
          rotation_schedule_id: string
          service_set_id: string | null
        }
        Insert: {
          assigned_date: string
          created_at?: string | null
          id?: string
          rotation_index?: number
          rotation_schedule_id: string
          service_set_id?: string | null
        }
        Update: {
          assigned_date?: string
          created_at?: string | null
          id?: string
          rotation_index?: number
          rotation_schedule_id?: string
          service_set_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_rotation_assignments_rotation_schedule_id_fkey"
            columns: ["rotation_schedule_id"]
            isOneToOne: false
            referencedRelation: "team_rotation_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_rotation_assignments_service_set_id_fkey"
            columns: ["service_set_id"]
            isOneToOne: false
            referencedRelation: "service_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      team_rotation_members: {
        Row: {
          created_at: string | null
          id: string
          role_id: string | null
          rotation_order: number
          rotation_schedule_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          rotation_order?: number
          rotation_schedule_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          rotation_order?: number
          rotation_schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_rotation_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "church_custom_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_rotation_members_rotation_schedule_id_fkey"
            columns: ["rotation_schedule_id"]
            isOneToOne: false
            referencedRelation: "team_rotation_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_rotation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_rotation_schedules: {
        Row: {
          church_account_id: string
          community_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_ko: string | null
          rotation_pattern: string
          rotation_start_date: string
          updated_at: string | null
        }
        Insert: {
          church_account_id: string
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ko?: string | null
          rotation_pattern?: string
          rotation_start_date: string
          updated_at?: string | null
        }
        Update: {
          church_account_id?: string
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ko?: string | null
          rotation_pattern?: string
          rotation_start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_rotation_schedules_church_account_id_fkey"
            columns: ["church_account_id"]
            isOneToOne: false
            referencedRelation: "church_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_rotation_schedules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      template_components: {
        Row: {
          component_type: string
          created_at: string | null
          default_assigned_to: string | null
          default_content: string | null
          duration_minutes: number | null
          id: string
          label: string
          notes: string | null
          position: number
          template_id: string
        }
        Insert: {
          component_type: string
          created_at?: string | null
          default_assigned_to?: string | null
          default_content?: string | null
          duration_minutes?: number | null
          id?: string
          label: string
          notes?: string | null
          position: number
          template_id: string
        }
        Update: {
          component_type?: string
          created_at?: string | null
          default_assigned_to?: string | null
          default_content?: string | null
          duration_minutes?: number | null
          id?: string
          label?: string
          notes?: string | null
          position?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_components_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "worship_set_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_songs: {
        Row: {
          created_at: string | null
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
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
      user_seeds: {
        Row: {
          created_at: string | null
          current_level: number
          id: string
          total_seeds: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_level?: number
          id?: string
          total_seeds?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_level?: number
          id?: string
          total_seeds?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_seeds_current_level_fkey"
            columns: ["current_level"]
            isOneToOne: false
            referencedRelation: "seed_levels"
            referencedColumns: ["level"]
          },
        ]
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
          church_account_id: string | null
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
          church_account_id?: string | null
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
          church_account_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invite_token?: string
          is_active?: boolean | null
          leader_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worship_communities_church_account_id_fkey"
            columns: ["church_account_id"]
            isOneToOne: false
            referencedRelation: "church_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_leader_applications: {
        Row: {
          church_name: string
          church_website: string
          country: string
          created_at: string | null
          denomination: string | null
          id: string
          introduction: string
          position: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
          years_serving: number
        }
        Insert: {
          church_name: string
          church_website: string
          country: string
          created_at?: string | null
          denomination?: string | null
          id?: string
          introduction: string
          position: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          years_serving: number
        }
        Update: {
          church_name?: string
          church_website?: string
          country?: string
          created_at?: string | null
          denomination?: string | null
          id?: string
          introduction?: string
          position?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          years_serving?: number
        }
        Relationships: []
      }
      worship_leader_profiles: {
        Row: {
          church_name: string
          church_website: string
          country: string
          created_at: string | null
          denomination: string | null
          id: string
          introduction: string
          position: string
          updated_at: string | null
          user_id: string
          years_serving: number
        }
        Insert: {
          church_name: string
          church_website: string
          country: string
          created_at?: string | null
          denomination?: string | null
          id?: string
          introduction: string
          position: string
          updated_at?: string | null
          user_id: string
          years_serving: number
        }
        Update: {
          church_name?: string
          church_website?: string
          country?: string
          created_at?: string | null
          denomination?: string | null
          id?: string
          introduction?: string
          position?: string
          updated_at?: string | null
          user_id?: string
          years_serving?: number
        }
        Relationships: []
      }
      worship_set_positions: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          role_id: string
          service_set_id: string
          slots: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          role_id: string
          service_set_id: string
          slots?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          role_id?: string
          service_set_id?: string
          slots?: number
        }
        Relationships: [
          {
            foreignKeyName: "worship_set_positions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "church_custom_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_set_positions_service_set_id_fkey"
            columns: ["service_set_id"]
            isOneToOne: false
            referencedRelation: "service_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_set_signups: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          position_id: string
          status: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          position_id: string
          status?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          position_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_set_signups_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "worship_set_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_set_templates: {
        Row: {
          band_name: string | null
          community_id: string | null
          created_at: string | null
          created_by: string
          id: string
          is_recurring: boolean | null
          name: string
          notes: string | null
          scripture_reference: string | null
          service_name: string | null
          service_time: string | null
          target_audience: string | null
          theme: string | null
          updated_at: string | null
          worship_duration: number | null
          worship_leader: string | null
        }
        Insert: {
          band_name?: string | null
          community_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_recurring?: boolean | null
          name: string
          notes?: string | null
          scripture_reference?: string | null
          service_name?: string | null
          service_time?: string | null
          target_audience?: string | null
          theme?: string | null
          updated_at?: string | null
          worship_duration?: number | null
          worship_leader?: string | null
        }
        Update: {
          band_name?: string | null
          community_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_recurring?: boolean | null
          name?: string
          notes?: string | null
          scripture_reference?: string | null
          service_name?: string | null
          service_time?: string | null
          target_audience?: string | null
          theme?: string | null
          updated_at?: string | null
          worship_duration?: number | null
          worship_leader?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worship_set_templates_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "worship_communities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { invitation_uuid: string }; Returns: boolean }
      award_seeds: {
        Args: {
          _activity_type: Database["public"]["Enums"]["seed_activity_type"]
          _description?: string
          _related_id?: string
          _seeds: number
          _user_id: string
        }
        Returns: number
      }
      can_manage_church_roles: {
        Args: { _church_account_id: string; _user_id: string }
        Returns: boolean
      }
      decline_invitation: {
        Args: { invitation_uuid: string }
        Returns: boolean
      }
      get_feature_flag: { Args: { _key: string }; Returns: boolean }
      get_invitation_by_id: {
        Args: { invitation_uuid: string }
        Returns: {
          community_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
        }[]
      }
      get_public_set_components: {
        Args: { share_token: string }
        Returns: {
          assigned_to: string
          component_position: number
          component_type: string
          content: string
          duration_minutes: number
          id: string
          label: string
          notes: string
        }[]
      }
      get_public_set_songs: {
        Args: { share_token: string }
        Returns: {
          bpm: number
          custom_notes: string
          id: string
          key_change_to: string
          lyrics: string
          override_score_file_url: string
          override_youtube_url: string
          song_artist: string
          song_default_key: string
          song_id: string
          song_key: string
          song_position: number
          song_score_file_url: string
          song_title: string
          song_youtube_url: string
        }[]
      }
      get_public_song_scores: {
        Args: { share_token: string }
        Returns: {
          file_url: string
          id: string
          page_number: number
          score_key: string
          score_position: number
          song_id: string
        }[]
      }
      get_public_worship_set: {
        Args: { share_token: string }
        Returns: {
          band_name: string
          community_id: string
          community_name: string
          date: string
          id: string
          notes: string
          scripture_reference: string
          service_name: string
          service_time: string
          target_audience: string
          theme: string
          worship_duration: number
          worship_leader: string
        }[]
      }
      get_song_usage_sets: {
        Args: { p_song_id: string }
        Returns: {
          community_id: string
          created_by: string
          service_name: string
          set_date: string
          set_id: string
          set_status: string
          song_position: number
          worship_leader: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_set_view_count: { Args: { set_id: string }; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_any_community_leader: { Args: { _user_id: string }; Returns: boolean }
      is_church_account_admin: {
        Args: { _church_account_id: string; _user_id: string }
        Returns: boolean
      }
      is_church_account_member: {
        Args: { _church_account_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_leader: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_owner: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_set_collaborator: {
        Args: { _set_id: string; _user_id: string }
        Returns: boolean
      }
      notify_community_birthdays: { Args: never; Returns: undefined }
      shares_community_membership: {
        Args: { _target_community_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "worship_leader" | "user"
      collaborator_role: "editor" | "viewer"
      seed_activity_type:
        | "profile_setup"
        | "avatar_upload"
        | "first_song_added"
        | "first_set_created"
        | "first_set_published"
        | "first_team_invite"
        | "first_community_post"
        | "song_added"
        | "song_edited"
        | "worship_set_created"
        | "worship_set_published"
        | "community_post"
        | "score_uploaded"
        | "lyrics_added"
        | "admin_bonus"
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
      seed_activity_type: [
        "profile_setup",
        "avatar_upload",
        "first_song_added",
        "first_set_created",
        "first_set_published",
        "first_team_invite",
        "first_community_post",
        "song_added",
        "song_edited",
        "worship_set_created",
        "worship_set_published",
        "community_post",
        "score_uploaded",
        "lyrics_added",
        "admin_bonus",
      ],
      set_status: ["draft", "published"],
    },
  },
} as const
