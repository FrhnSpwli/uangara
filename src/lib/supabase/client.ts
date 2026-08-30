import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseConfig } from './env'

let client: SupabaseClient | undefined

export function getSupabaseClient() {
  if (!client) {
    const { publishableKey, url } = getSupabaseConfig()
    client = createClient(url, publishableKey)
  }

  return client
}
