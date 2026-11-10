import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const apakahSupabaseAktif = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://proyek-kamu.supabase.co"
);

export const supabase: SupabaseClient | null = apakahSupabaseAktif
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
