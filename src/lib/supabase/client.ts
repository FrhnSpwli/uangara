import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '../../types/database'
import { getSupabaseConfig } from './env'

let client: SupabaseClient<Database> | undefined

export function getSupabaseClient() {
  if (!client) {
    const { publishableKey, url } = getSupabaseConfig()
    client = createClient<Database>(url, publishableKey)
  }

  return client
}
