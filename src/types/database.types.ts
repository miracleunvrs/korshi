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
      apartments: {
        Row: {
          created_at: string
          entrance_id: string
          floor: number | null
          id: string
          number: string
        }
        Insert: {
          created_at?: string
          entrance_id: string
          floor?: number | null
          id?: string
          number: string
        }
        Update: {
          created_at?: string
          entrance_id?: string
          floor?: number | null
          id?: string
          number?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartments_entrance_id_fkey"
            columns: ["entrance_id"]
            isOneToOne: false
            referencedRelation: "entrances"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          complex_id: string
          created_at: string
          id: string
          number: string
        }
        Insert: {
          complex_id: string
          created_at?: string
          id?: string
          number: string
        }
        Update: {
          complex_id?: string
          created_at?: string
          id?: string
          number?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_members: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: Database["public"]["Enums"]["chat_member_role"]
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["chat_member_role"]
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["chat_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          avatar_url: string | null
          building_id: string | null
          complex_id: string
          created_at: string
          created_by: string | null
          description: string | null
          entrance_id: string | null
          id: string
          is_official: boolean
          last_message_at: string | null
          name: string | null
          type: Database["public"]["Enums"]["chat_type"]
        }
        Insert: {
          avatar_url?: string | null
          building_id?: string | null
          complex_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entrance_id?: string | null
          id?: string
          is_official?: boolean
          last_message_at?: string | null
          name?: string | null
          type?: Database["public"]["Enums"]["chat_type"]
        }
        Update: {
          avatar_url?: string | null
          building_id?: string | null
          complex_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entrance_id?: string | null
          id?: string
          is_official?: boolean
          last_message_at?: string | null
          name?: string | null
          type?: Database["public"]["Enums"]["chat_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chats_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_entrance_id_fkey"
            columns: ["entrance_id"]
            isOneToOne: false
            referencedRelation: "entrances"
            referencedColumns: ["id"]
          },
        ]
      }
      classifieds: {
        Row: {
          author_id: string
          category: string
          complex_id: string
          created_at: string
          currency: string
          description: string
          id: string
          image_path: string | null
          location: string | null
          price: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          complex_id: string
          created_at?: string
          currency?: string
          description: string
          id?: string
          image_path?: string | null
          location?: string | null
          price?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          complex_id?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          image_path?: string | null
          location?: string | null
          price?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classifieds_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classifieds_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      complexes: {
        Row: {
          address: string | null
          city: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          address?: string | null
          city?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          address?: string | null
          city?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      entrances: {
        Row: {
          building_id: string
          created_at: string
          id: string
          number: number
        }
        Insert: {
          building_id: string
          created_at?: string
          id?: string
          number: number
        }
        Update: {
          building_id?: string
          created_at?: string
          id?: string
          number?: number
        }
        Relationships: [
          {
            foreignKeyName: "entrances_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraiser_payments: {
        Row: {
          amount: number
          comment: string | null
          confirmed_at: string | null
          created_at: string
          fundraiser_id: string
          id: string
          is_anonymous: boolean
          user_id: string | null
        }
        Insert: {
          amount: number
          comment?: string | null
          confirmed_at?: string | null
          created_at?: string
          fundraiser_id: string
          id?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
        Update: {
          amount?: number
          comment?: string | null
          confirmed_at?: string | null
          created_at?: string
          fundraiser_id?: string
          id?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_payments_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundraiser_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraisers: {
        Row: {
          created_at: string
          currency: string
          current_amount: number
          ends_at: string | null
          id: string
          initiative_id: string | null
          payment_url: string | null
          post_id: string
          qr_url: string | null
          status: Database["public"]["Enums"]["fundraiser_status"]
          target_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_amount?: number
          ends_at?: string | null
          id?: string
          initiative_id?: string | null
          payment_url?: string | null
          post_id: string
          qr_url?: string | null
          status?: Database["public"]["Enums"]["fundraiser_status"]
          target_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_amount?: number
          ends_at?: string | null
          id?: string
          initiative_id?: string | null
          payment_url?: string | null
          post_id?: string
          qr_url?: string | null
          status?: Database["public"]["Enums"]["fundraiser_status"]
          target_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraisers_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundraisers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_supports: {
        Row: {
          created_at: string
          id: string
          initiative_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initiative_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initiative_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_supports_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_supports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          goal: string | null
          id: string
          post_id: string
          stage: Database["public"]["Enums"]["initiative_stage"]
          supporters: number
          updated_at: string
        }
        Insert: {
          goal?: string | null
          id?: string
          post_id: string
          stage?: Database["public"]["Enums"]["initiative_stage"]
          supporters?: number
          updated_at?: string
        }
        Update: {
          goal?: string | null
          id?: string
          post_id?: string
          stage?: Database["public"]["Enums"]["initiative_stage"]
          supporters?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          id: string
          is_deleted: boolean
          reply_to_id: string | null
          sender_id: string
          type: Database["public"]["Enums"]["message_type"]
          updated_at: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          reply_to_id?: string | null
          sender_id: string
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          reply_to_id?: string | null
          sender_id?: string
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          created_at: string
          id: string
          moderator_id: string
          reason: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target"]
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          created_at?: string
          id?: string
          moderator_id: string
          reason?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target"]
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          created_at?: string
          id?: string
          moderator_id?: string
          reason?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["moderation_target"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
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
      poll_options: {
        Row: {
          id: string
          poll_id: string
          position: number
          text: string
          votes_count: number
        }
        Insert: {
          id?: string
          poll_id: string
          position?: number
          text: string
          votes_count?: number
        }
        Update: {
          id?: string
          poll_id?: string
          position?: number
          text?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          ends_at: string | null
          id: string
          is_multiple: boolean
          post_id: string
          total_votes: number
        }
        Insert: {
          ends_at?: string | null
          id?: string
          is_multiple?: boolean
          post_id: string
          total_votes?: number
        }
        Update: {
          ends_at?: string | null
          id?: string
          is_multiple?: boolean
          post_id?: string
          total_votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_attachments: {
        Row: {
          created_at: string
          id: string
          name: string | null
          post_id: string
          size: number | null
          type: Database["public"]["Enums"]["attachment_type"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          post_id: string
          size?: number | null
          type?: Database["public"]["Enums"]["attachment_type"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          post_id?: string
          size?: number | null
          type?: Database["public"]["Enums"]["attachment_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          building_id: string | null
          complex_id: string
          content: string
          created_at: string
          currency: string | null
          entrance_id: string | null
          id: string
          is_official: boolean
          price: number | null
          status: Database["public"]["Enums"]["post_status"]
          territory: Database["public"]["Enums"]["territory_type"]
          title: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          building_id?: string | null
          complex_id: string
          content: string
          created_at?: string
          currency?: string | null
          entrance_id?: string | null
          id?: string
          is_official?: boolean
          price?: number | null
          status?: Database["public"]["Enums"]["post_status"]
          territory?: Database["public"]["Enums"]["territory_type"]
          title?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          building_id?: string | null
          complex_id?: string
          content?: string
          created_at?: string
          currency?: string | null
          entrance_id?: string | null
          id?: string
          is_official?: boolean
          price?: number | null
          status?: Database["public"]["Enums"]["post_status"]
          territory?: Database["public"]["Enums"]["territory_type"]
          title?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_entrance_id_fkey"
            columns: ["entrance_id"]
            isOneToOne: false
            referencedRelation: "entrances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apartment_id: string | null
          avatar_url: string | null
          bio: string | null
          complex_id: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          apartment_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          complex_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          apartment_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          complex_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          categories: string[]
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          profile_id: string
          rating: number
          recommended_by: string | null
          reviews_count: number
          service_areas: string[]
          updated_at: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          profile_id: string
          rating?: number
          recommended_by?: string | null
          reviews_count?: number
          service_areas?: string[]
          updated_at?: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          profile_id?: string
          rating?: number
          recommended_by?: string | null
          reviews_count?: number
          service_areas?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_recommended_by_fkey"
            columns: ["recommended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          apartment_number: string
          building_number: string
          created_at: string
          document_path: string
          document_type: string
          entrance_number: number
          full_name: string
          id: string
          phone: string | null
          review_reason: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment_number: string
          building_number: string
          created_at?: string
          document_path: string
          document_type: string
          entrance_number: number
          full_name: string
          id?: string
          phone?: string | null
          review_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment_number?: string
          building_number?: string
          created_at?: string
          document_path?: string
          document_type?: string
          entrance_number?: number
          full_name?: string
          id?: string
          phone?: string | null
          review_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
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
      auth_user_apartment_id: { Args: never; Returns: string }
      auth_user_complex_id: { Args: never; Returns: string }
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      auth_user_verified: { Args: never; Returns: boolean }
      create_direct_chat: { Args: { p_target_user: string }; Returns: string }
      is_chat_member: { Args: { p_chat_id: string }; Returns: boolean }
      record_fundraiser_payment: {
        Args: {
          p_amount: number
          p_comment?: string
          p_fundraiser_id: string
          p_is_anonymous?: boolean
        }
        Returns: {
          amount: number
          comment: string | null
          confirmed_at: string | null
          created_at: string
          fundraiser_id: string
          id: string
          is_anonymous: boolean
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "fundraiser_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_verification_request: {
        Args: { p_approved: boolean; p_reason?: string; p_request_id: string }
        Returns: {
          apartment_number: string
          building_number: string
          created_at: string
          document_path: string
          document_type: string
          entrance_number: number
          full_name: string
          id: string
          phone: string | null
          review_reason: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_request_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "verification_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      attachment_type: "image" | "document" | "video"
      chat_member_role: "member" | "admin"
      chat_type: "complex" | "building" | "entrance" | "thematic" | "direct"
      fundraiser_status: "active" | "completed" | "cancelled"
      initiative_stage:
        | "proposal"
        | "discussion"
        | "voting"
        | "hoa_review"
        | "approved"
        | "fundraising"
        | "implementation"
        | "completed"
        | "rejected"
      message_type: "text" | "image" | "document" | "system"
      moderation_action: "warn" | "hide" | "delete" | "ban" | "restore"
      moderation_target: "post" | "comment" | "profile" | "chat_message"
      post_status: "active" | "closed" | "archived" | "under_review"
      post_type:
        | "post"
        | "announcement"
        | "service"
        | "help_request"
        | "poll"
        | "initiative"
        | "event"
        | "official_news"
        | "official_poll"
        | "fundraiser"
      reaction_type: "like" | "support" | "thanks"
      territory_type: "entrance" | "building" | "complex"
      user_role: "resident" | "hoa_official" | "service_provider" | "admin"
      verification_request_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      attachment_type: ["image", "document", "video"],
      chat_member_role: ["member", "admin"],
      chat_type: ["complex", "building", "entrance", "thematic", "direct"],
      fundraiser_status: ["active", "completed", "cancelled"],
      initiative_stage: [
        "proposal",
        "discussion",
        "voting",
        "hoa_review",
        "approved",
        "fundraising",
        "implementation",
        "completed",
        "rejected",
      ],
      message_type: ["text", "image", "document", "system"],
      moderation_action: ["warn", "hide", "delete", "ban", "restore"],
      moderation_target: ["post", "comment", "profile", "chat_message"],
      post_status: ["active", "closed", "archived", "under_review"],
      post_type: [
        "post",
        "announcement",
        "service",
        "help_request",
        "poll",
        "initiative",
        "event",
        "official_news",
        "official_poll",
        "fundraiser",
      ],
      reaction_type: ["like", "support", "thanks"],
      territory_type: ["entrance", "building", "complex"],
      user_role: ["resident", "hoa_official", "service_provider", "admin"],
      verification_request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
