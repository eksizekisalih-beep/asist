
import { NextResponse } from "next/server";
import { getCalendarEvents, getRecentEmails } from "@/lib/google-service";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [events] = await Promise.all([
      getCalendarEvents(),
    ]);

    // Silently trigger background sync for new emails (we don't wait for it to finish to keep dashboard fast)
    // but for the first time or testing, the user might want to wait. 
    // Let's at least fetch what we already have in DB.
    
    // 1. Fetch document count
    const { count: docCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    // 2. Fetch processed emails from DB
    const { data: dbEmails } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 3. Fetch upcoming reminders from DB
    const { count: reminderCount } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .gte("reminder_at", new Date().toISOString());

    return NextResponse.json({
      events, // Still from Google for real-time calendar view
      emails: dbEmails || [], // Now from our OWN analyzed database
      stats: {
        documents: docCount || 0,
        reminders: reminderCount || 0,
        emails: dbEmails?.length || 0
      }
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
