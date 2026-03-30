// IPSAS Advisor Supabase client — server-to-server connection via service role key
// Used by PFS admin to manage IPSAS subgroups (regulatory layers)

import { createClient } from "@supabase/supabase-js"

export function createIpsasAdminClient() {
  const url = process.env.IPSAS_SUPABASE_URL
  const key = process.env.IPSAS_SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("IPSAS_SUPABASE_URL and IPSAS_SUPABASE_SERVICE_ROLE_KEY must be set")
  }

  return createClient(url, key)
}
