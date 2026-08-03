import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@civic-reporting/database-types';
import { getPublicSupabaseConfig } from './config';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (!browserClient) {
    const { publishableKey, url } = getPublicSupabaseConfig();
    browserClient = createBrowserClient<Database>(url, publishableKey);
  }
  return browserClient;
}
