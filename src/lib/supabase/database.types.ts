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
      devices: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          rated_power_w: number;
          daily_hours: string;
          image_url: string | null;
          is_active: boolean;
          schedule: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          rated_power_w: number;
          daily_hours: string;
          image_url?: string | null;
          is_active?: boolean;
          schedule?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          rated_power_w?: number;
          daily_hours?: string;
          image_url?: string | null;
          is_active?: boolean;
          schedule?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          device_id: string | null;
          date: string;
          hour: number;
          kwh: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id?: string | null;
          date: string;
          hour: number;
          kwh: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string | null;
          date?: string;
          hour?: number;
          kwh?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_logs_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: string;
          content: string;
          tool_calls: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: string;
          content: string;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: string;
          content?: string;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          user_id: string;
          plan_type: string;
          location: string;
          household_size: number;
        };
        Insert: {
          user_id: string;
          plan_type?: string;
          location?: string;
          household_size?: number;
        };
        Update: {
          user_id?: string;
          plan_type?: string;
          location?: string;
          household_size?: number;
        };
        Relationships: [];
      };
      mcp_tokens: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          token_hash: string;
          token_prefix: string;
          last_used_at: string | null;
          expires_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          token_hash: string;
          token_prefix: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          token_hash?: string;
          token_prefix?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_usage_logs: {
        Args: {
          p_user_id: string;
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_device_id?: string | null;
          p_page?: number;
          p_page_size?: number;
          p_sort_by?: string;
          p_sort_order?: string;
        };
        Returns: Json;
      };
      get_weekly_usage_trend: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_monthly_usage_trend: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_category_usage: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_usage_by_date_range: {
        Args: {
          p_user_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json;
      };
      get_monthly_usage_summary: {
        Args: {
          p_user_id: string;
          p_year: number;
          p_month: number;
        };
        Returns: Json;
      };
      get_chat_sessions: {
        Args: {
          p_user_id: string;
          p_search?: string | null;
          p_page?: number;
          p_page_size?: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
