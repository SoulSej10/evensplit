// Supabase Edge Function: notify-group-members
//
// Phase 6 stretch (cross-device push notifications). Called by database
// triggers on public.expenses and public.settlements (via pg_net) whenever
// a new expense or settlement is inserted. Looks up every OTHER member of
// the affected group (excludes the acting user, who already gets a local
// notification on-device per apps/mobile/src/lib/notifications.ts), fetches
// their registered Expo push tokens from public.push_tokens, and sends a
// push notification to each via Expo's push API.
//
// Request body: { group_id: string, actor_user_id: string, title: string, body: string }
//
// A member only receives a push if they've opened the app, granted
// notification permission, and therefore have a row in push_tokens
// (apps/mobile/src/lib/notifications.ts registers it on grant).

import { createClient } from "jsr:@supabase/supabase-js@2";

interface NotifyRequest {
  group_id: string;
  actor_user_id: string;
  title: string;
  body: string;
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as Partial<NotifyRequest>;
    const { group_id, actor_user_id, title, body } = payload;

    if (!group_id || !actor_user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "group_id, actor_user_id, title, and body are required" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Other members of this group (exclude the actor, who already has a
    // local notification on their own device for their own action).
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", group_id)
      .neq("user_id", actor_user_id);
    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no other members" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const memberIds = members.map((m) => m.user_id);

    const { data: tokenRows, error: tokensError } = await supabase
      .from("push_tokens")
      .select("expo_push_token")
      .in("user_id", memberIds);
    if (tokensError) throw tokensError;

    if (!tokenRows || tokenRows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no registered tokens" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = tokenRows.map((t) => ({
      to: t.expo_push_token,
      sound: "default",
      title,
      body,
      data: { group_id },
    }));

    // Expo's push API accepts up to 100 messages per request.
    const chunks: (typeof messages)[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    const results = [];
    for (const chunk of chunks) {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      results.push(await res.json());
    }

    return new Response(JSON.stringify({ sent: messages.length, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
