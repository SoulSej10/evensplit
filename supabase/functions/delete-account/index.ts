// Supabase Edge Function: delete-account
//
// Real, server-side account deletion. The previous client-side "delete
// account" flow only removed public.users + group_members rows, which
// silently failed for any user with real activity: expenses.created_by/
// paid_by, groups.created_by, settlements.from_user/to_user, and
// invites.created_by are all ON DELETE RESTRICT (by design, so one
// person's exit can't corrupt a group's shared expense history for
// everyone else) - and it never touched auth.users at all, so a "deleted"
// account could always still log back in.
//
// public.users.id -> auth.users(id) is ON DELETE CASCADE, so calling
// auth.admin.deleteUser() directly would cascade into public.users and hit
// those same RESTRICT constraints for anyone who ever created a group,
// added an expense, or was paid/settled with. Hard-deleting a user who has
// shared financial history with other people isn't actually safe here -
// the standard, correct pattern for this shape of data is anonymize +
// disable login, not a hard delete of everything:
//
//   1. Hard-delete the caller's exclusively-owned data (personal finance
//      rows, push tokens, group memberships - nothing else references
//      these).
//   2. Anonymize their public.users row (display name, avatar) so it no
//      longer identifies them, but leave the row in place so other
//      members' groups/expenses/settlements keep resolving correctly.
//   3. Disable the actual login credential via the GoTrue admin API - ban
//      the account, and randomize its email/password - so it is genuinely
//      impossible to sign back in, without touching auth.users' row
//      identity (which would cascade-delete step 2's anonymized row).
//
// Authenticates the caller from their own JWT (never trusts a user id from
// the request body) so this can only ever delete the caller's own account.

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Resolve the caller's own id from their JWT - this is the only
    // trustworthy source of "who is asking to be deleted".
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }
    const userId = user.id;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Hard-delete exclusively-owned data.
    await admin.from("personal_transactions").delete().eq("user_id", userId);
    await admin.from("personal_budgets").delete().eq("user_id", userId);
    await admin.from("personal_categories").delete().eq("user_id", userId);
    await admin.from("personal_accounts").delete().eq("user_id", userId);
    await admin.from("push_tokens").delete().eq("user_id", userId);
    await admin.from("group_members").delete().eq("user_id", userId);

    // 2. Anonymize the profile row (kept in place for other members' shared
    // expenses/settlements/groups to keep resolving a valid user).
    const { error: anonymizeError } = await admin
      .from("users")
      .update({ display_name: "Deleted user", avatar_url: null })
      .eq("id", userId);
    if (anonymizeError) throw anonymizeError;

    // 3. Disable the login credential permanently.
    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // ~100 years - effectively permanent
      password: crypto.randomUUID() + crypto.randomUUID(),
      email: `deleted-${userId}@deleted.evensplit.invalid`,
      email_confirm: true,
    });
    if (banError) throw banError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
