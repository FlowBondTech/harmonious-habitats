import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'hspaces-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      invite_codes: {
        Row: {
          id: string;
          code: string;
          created_by: string | null;
          used_by: string | null;
          is_used: boolean | null;
          expires_at: string | null;
          created_at: string | null;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          created_by?: string | null;
          used_by?: string | null;
          is_used?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          created_by?: string | null;
          used_by?: string | null;
          is_used?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
          used_at?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          bio: string | null;
          expertise: string[] | null;
          is_admin: boolean | null;
          invite_code_used: string | null;
          profile_setup_completed: boolean;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          bio?: string | null;
          expertise?: string[] | null;
          is_admin?: boolean | null;
          invite_code_used?: string | null;
          profile_setup_completed?: boolean;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          bio?: string | null;
          expertise?: string[] | null;
          is_admin?: boolean | null;
          invite_code_used?: string | null;
          profile_setup_completed?: boolean;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      spaces: {
        Row: {
          id: string;
          title: string;
          description: string;
          holder_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          location: string;
          capacity: number;
          status: string;
          pricing_type: string;
          price_amount: number | null;
          suggested_donation: number | null;
          image_url: string | null;
          latitude: number | null;
          longitude: number | null;
          location_radius: number | null;
          location_restricted: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          holder_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          location: string;
          capacity: number;
          status: string;
          pricing_type: string;
          price_amount?: number | null;
          suggested_donation?: number | null;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_radius?: number | null;
          location_restricted?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          holder_id?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          location?: string;
          capacity?: number;
          status?: string;
          pricing_type?: string;
          price_amount?: number | null;
          suggested_donation?: number | null;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_radius?: number | null;
          location_restricted?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      space_attendees: {
        Row: {
          id: string;
          space_id: string | null;
          user_id: string | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          space_id?: string | null;
          user_id?: string | null;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          space_id?: string | null;
          user_id?: string | null;
          joined_at?: string | null;
        };
      };
    };
  };
};