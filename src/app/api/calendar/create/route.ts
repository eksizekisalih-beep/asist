import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-service";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { title, startTime, emailId } = await request.json();
    const supabase = await createClient();
    
    // 1. Create event in Google Calendar
    const event = await createCalendarEvent(title, startTime);
    
    // 2. Add as a reminder in our DB for tracking
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("reminders").insert({
        user_id: user.id,
        title: title,
        reminder_at: startTime,
        description: `E-posta üzerinden oluşturuldu.`,
        reference_id: emailId
      });
      
      // 3. Mark the email as processed/accepted
      await supabase
        .from("emails")
        .update({ processing_status: 'accepted' })
        .eq("id", emailId);
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Calendar Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
