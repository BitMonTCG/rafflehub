// /Users/farhoudtalebi/Repositories/rafflehub/client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not defined. Please check your .env file or Vercel environment variables.");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is not defined. Please check your .env file or Vercel environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
