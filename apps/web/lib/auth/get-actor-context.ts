import {
  actorContextSchema,
  type ActorContext,
} from '@civic-reporting/contracts';
import { createClient } from '@/lib/supabase/server';

export async function getActorContext(): Promise<ActorContext | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) {
    return null;
  }

  const { data, error } = await supabase.rpc('current_actor_context');
  if (error || !data) {
    return null;
  }

  const parsed = actorContextSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
