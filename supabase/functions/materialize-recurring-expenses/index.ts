// Supabase Edge Function: materialize-recurring-expenses
//
// Phase 6 stretch (recurring expenses). Finds "template" expenses
// (is_recurring = true) whose next_occurrence_date has arrived, creates a
// new concrete expense instance for that date (copying description/amount/
// payer/split/category and the expense_shares breakdown), links the new
// instance back to the template via recurrence_parent_id, and advances the
// template's next_occurrence_date according to its recurrence_rule.
//
// Scheduled via pg_cron + pg_net — see
// supabase/migrations/0008_schedule_recurring_expense_materializer.sql,
// which runs `select cron.schedule('materialize-recurring-expenses-daily',
// '15 0 * * *', ...)` to POST to this function once a day at 00:15 UTC.
//
// recurrence_rule is a simplified subset of RRULE: "FREQ=DAILY",
// "FREQ=WEEKLY", "FREQ=MONTHLY" (optionally ";INTERVAL=N").

import { createClient } from "jsr:@supabase/supabase-js@2";

interface RecurrenceRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
}

function parseRecurrenceRule(rule: string | null): RecurrenceRule | null {
  if (!rule) return null;
  const parts = Object.fromEntries(
    rule.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim().toUpperCase(), v?.trim().toUpperCase()];
    })
  );
  const freq = parts["FREQ"];
  if (freq !== "DAILY" && freq !== "WEEKLY" && freq !== "MONTHLY") return null;
  const interval = Number(parts["INTERVAL"] ?? "1");
  return { freq, interval: Number.isFinite(interval) && interval > 0 ? interval : 1 };
}

function advanceDate(dateStr: string, rule: RecurrenceRule): string {
  const d = new Date(dateStr + "T00:00:00Z");
  switch (rule.freq) {
    case "DAILY":
      d.setUTCDate(d.getUTCDate() + rule.interval);
      break;
    case "WEEKLY":
      d.setUTCDate(d.getUTCDate() + rule.interval * 7);
      break;
    case "MONTHLY":
      d.setUTCMonth(d.getUTCMonth() + rule.interval);
      break;
  }
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().slice(0, 10);

    const { data: dueTemplates, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("is_recurring", true)
      .not("next_occurrence_date", "is", null)
      .lte("next_occurrence_date", today);

    if (fetchError) throw fetchError;
    if (!dueTemplates || dueTemplates.length === 0) {
      return new Response(JSON.stringify({ materialized: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let materializedCount = 0;
    const errors: { template_id: string; message: string }[] = [];

    for (const template of dueTemplates) {
      try {
        const rule = parseRecurrenceRule(template.recurrence_rule);
        if (!rule) continue;

        // Guard against runaway loops if the function hasn't run in a
        // while: materialize at most one instance per template per
        // invocation, then advance next_occurrence_date so the next call
        // picks up the following one.
        const occurrenceDate: string = template.next_occurrence_date;

        const { data: newExpense, error: insertError } = await supabase
          .from("expenses")
          .insert({
            group_id: template.group_id,
            description: template.description,
            amount: template.amount,
            currency: template.currency,
            paid_by: template.paid_by,
            split_type: template.split_type,
            category: template.category,
            expense_date: occurrenceDate,
            created_by: template.created_by,
            is_recurring: false,
            recurrence_rule: null,
            recurrence_parent_id: template.id,
          })
          .select()
          .single();
        if (insertError) throw insertError;

        const { data: templateShares, error: sharesError } = await supabase
          .from("expense_shares")
          .select("user_id, share_amount")
          .eq("expense_id", template.id);
        if (sharesError) throw sharesError;

        if (templateShares && templateShares.length > 0) {
          const { error: shareInsertError } = await supabase.from("expense_shares").insert(
            templateShares.map((s) => ({
              expense_id: newExpense.id,
              user_id: s.user_id,
              share_amount: s.share_amount,
            }))
          );
          if (shareInsertError) throw shareInsertError;
        }

        const nextDate = advanceDate(occurrenceDate, rule);
        const { error: updateError } = await supabase
          .from("expenses")
          .update({ next_occurrence_date: nextDate })
          .eq("id", template.id);
        if (updateError) throw updateError;

        materializedCount++;
      } catch (err) {
        errors.push({
          template_id: template.id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(JSON.stringify({ materialized: materializedCount, errors }), {
      headers: { "Content-Type": "application/json" },
      status: errors.length > 0 ? 207 : 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
