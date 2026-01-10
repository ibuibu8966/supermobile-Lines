import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from './encryption'

/**
 * Create a Supabase client for external service database
 * @param supabaseUrl - The Supabase project URL
 * @param encryptedServiceRoleKey - The encrypted service role key
 * @returns Supabase client instance
 */
export function createServiceSupabaseClient(
  supabaseUrl: string,
  encryptedServiceRoleKey: string
): SupabaseClient {
  const serviceRoleKey = decrypt(encryptedServiceRoleKey)

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
