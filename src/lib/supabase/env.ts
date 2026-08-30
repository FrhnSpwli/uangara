type SupabaseEnvironmentKey =
  'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'

export type SupabasePublicEnvironment = Partial<
  Record<SupabaseEnvironmentKey, string>
>

export interface SupabasePublicConfig {
  url: string
  publishableKey: string
}

function requireEnvironmentValue(
  environment: SupabasePublicEnvironment,
  key: SupabaseEnvironmentKey,
) {
  const value = environment[key]?.trim()

  if (!value) {
    throw new Error(
      `[Uangara configuration] ${key} is required. Copy .env.example to .env and provide a browser-safe Supabase value.`,
    )
  }

  return value
}

export function resolveSupabaseConfig(
  environment: SupabasePublicEnvironment,
): SupabasePublicConfig {
  return {
    url: requireEnvironmentValue(environment, 'VITE_SUPABASE_URL'),
    publishableKey: requireEnvironmentValue(
      environment,
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ),
  }
}

export function getSupabaseConfig() {
  return resolveSupabaseConfig(import.meta.env)
}
