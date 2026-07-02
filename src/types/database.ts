export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          sober_since: string | null;
          recovery_goal: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          is_mentor: boolean;
          mentor_recovery_level: string | null;
          onboarding_completed: boolean;
          preferences: Json | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          sober_since?: string | null;
          recovery_goal?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          is_mentor?: boolean;
          mentor_recovery_level?: string | null;
          onboarding_completed?: boolean;
          preferences?: Json | null;
        };
        Update: {
          id?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          sober_since?: string | null;
          recovery_goal?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          is_mentor?: boolean;
          mentor_recovery_level?: string | null;
          onboarding_completed?: boolean;
          preferences?: Json | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          target_date: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          target_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          text?: string;
          target_date?: string | null;
          completed_at?: string | null;
        };
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          mood: string;
          mood_emoji: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          mood: string;
          mood_emoji: string;
          notes?: string | null;
        };
        Update: {
          mood?: string;
          mood_emoji?: string;
          notes?: string | null;
        };
      };
      drinking_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          paused_count: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          paused_count?: number;
          notes?: string | null;
        };
        Update: {
          ended_at?: string | null;
          paused_count?: number;
          notes?: string | null;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          triggers: string[];
          affected_others: string[];
          notes: string | null;
          drinking_session_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          triggers: string[];
          affected_others: string[];
          notes?: string | null;
          drinking_session_id?: string | null;
        };
        Update: {
          triggers?: string[];
          affected_others?: string[];
          notes?: string | null;
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          content: string;
          reactions: Json;
          is_anonymous: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          content: string;
          reactions?: Json;
          is_anonymous?: boolean;
        };
        Update: {
          content?: string;
          reactions?: Json;
        };
      };
      mentor_profiles: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          recovery_level: string;
          bio: string | null;
          is_available: boolean;
          total_sessions: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          recovery_level: string;
          bio?: string | null;
          is_available?: boolean;
          total_sessions?: number;
        };
        Update: {
          recovery_level?: string;
          bio?: string | null;
          is_available?: boolean;
          total_sessions?: number;
        };
      };
      mentor_requests: {
        Row: {
          id: string;
          requester_id: string;
          mentor_id: string;
          created_at: string;
          status: string;
          message: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          mentor_id: string;
          created_at?: string;
          status?: string;
          message?: string | null;
        };
        Update: {
          status?: string;
          message?: string | null;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          messages: Json;
          session_type: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          messages?: Json;
          session_type?: string;
        };
        Update: {
          updated_at?: string;
          messages?: Json;
        };
      };
      messages: {
        Row: {
          id: string;
          request_id: string;
          sender_id: string;
          created_at: string;
          content: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          sender_id: string;
          created_at?: string;
          content: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      user_blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          request_id: string | null;
          created_at: string;
          reason: string;
          details: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          request_id?: string | null;
          created_at?: string;
          reason: string;
          details?: string | null;
          status?: string;
        };
        Update: {
          status?: string;
        };
      };
      admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      dm_threads: {
        Row: {
          id: string;
          requester_id: string;
          recipient_id: string;
          status: string;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          recipient_id: string;
          status?: string;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          status?: string;
          responded_at?: string | null;
        };
      };
      dm_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          created_at: string;
          content: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          created_at?: string;
          content: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      urge_events: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          outcome: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          outcome: string;
        };
        Update: Record<string, never>;
      };
      alcohol_free_days: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          daily_checkin: boolean;
          drinking_reminders: boolean;
          milestone_alerts: boolean;
          community_updates: boolean;
          morning_reflection: boolean;
          push_token: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_checkin?: boolean;
          drinking_reminders?: boolean;
          milestone_alerts?: boolean;
          community_updates?: boolean;
          morning_reflection?: boolean;
          push_token?: string | null;
        };
        Update: {
          daily_checkin?: boolean;
          drinking_reminders?: boolean;
          milestone_alerts?: boolean;
          community_updates?: boolean;
          morning_reflection?: boolean;
          push_token?: string | null;
        };
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
