import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Fallback values for development/preview
const fallbackUrl = "https://placeholder.supabase.co"
const fallbackKey = "placeholder-key"

// Use actual values if available, otherwise use fallbacks
const url = supabaseUrl || fallbackUrl
const key = supabaseAnonKey || fallbackKey

// Only create real client if we have actual credentials
const hasValidCredentials =
  supabaseUrl && supabaseAnonKey && supabaseUrl !== fallbackUrl && supabaseAnonKey !== fallbackKey

// Singleton client instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!hasValidCredentials) {
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseClient
}

// Server-side client (for server actions)
export function createServerClient() {
  if (!hasValidCredentials) {
    return null
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

// Helper to check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return hasValidCredentials
}

// Export the singleton instance for backward compatibility
export const supabase = getSupabaseClient()
