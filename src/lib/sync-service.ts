
import { google } from "googleapis";
import { getGoogleOAuthClient } from "./google";
import { createClient } from "./supabase-server";
import { classifyEmail } from "./gemini";
import { createCalendarEvent } from "./google-service";

export async function syncUserEmails(providedUserId?: string) {
  const supabase = await createClient();
  let userId = providedUserId;

  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, message: "Oturum yok ve userId sağlanmadı" };
    userId = session.user.id;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, ai_api_key, use_own_api_key")
    .eq("id", userId)
    .single();

  if (!profile?.google_access_token) return { success: false, message: "Google bağlı değil" };

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const aiKey = profile.use_own_api_key ? profile.ai_api_key : undefined;

  try {
    // 1. Fetch unread messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: "is:unread"
    });

    const messages = response.data.messages || [];
    let syncedCount = 0;

    for (const msg of messages) {
      // Check if already processed
      const { data: existing } = await supabase
        .from("emails")
        .select("id")
        .eq("external_id", msg.id)
        .single();

      if (existing) continue;

      // 2. Get full details
      const details = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
      });

      const snippet = details.data.snippet || "";
      const headers = details.data.payload?.headers;
      const subject = headers?.find(h => h.name === "Subject")?.value || "Konusuz";
      const sender = headers?.find(h => h.name === "From")?.value || "Bilinmiyor";

      // 3. AI Analysis
      const analysis = await classifyEmail(`${subject} - ${snippet}`, aiKey || undefined);

      // 4. Save to DB
      const { data: savedEmail, error: emailErr } = await supabase
        .from("emails")
        .insert({
          user_id: userId,
          external_id: msg.id,
          subject,
          sender,
          summary: analysis.summary,
          is_processed: true,
          proposed_actions: analysis
        })
        .select()
        .single();

      if (emailErr) {
          console.error("Email insert error:", emailErr);
          continue;
      }

      // 5. Automatic Actions
      if (analysis.action === "add_calendar" && analysis.appointmentDate) {
        try {
          // Add to Google Calendar
          await createCalendarEvent(analysis.title || subject, analysis.appointmentDate);
          
          // Add to local reminders (System will notify)
          await supabase.from("reminders").insert({
            user_id: userId,
            title: analysis.title || subject,
            reminder_at: analysis.appointmentDate,
            description: "E-postadan otomatik oluşturuldu: " + analysis.summary,
            reference_id: savedEmail.id
          });

          // Extra reminders: 1 hour before
          const oneHourBefore = new Date(new Date(analysis.appointmentDate).getTime() - 60 * 60 * 1000).toISOString();
          await supabase.from("reminders").insert({
            user_id: userId,
            title: `Hatırlatma: ${analysis.title || subject} (1 saat kaldı)`,
            reminder_at: oneHourBefore,
            priority: 'high',
            reference_id: savedEmail.id
          });

          // Extra reminders: Morning of (8:00 AM)
          const morningOf = new Date(analysis.appointmentDate);
          morningOf.setHours(8, 0, 0, 0);
          if (new Date() < morningOf) { // Sadece gelecekse ekle
            await supabase.from("reminders").insert({
              user_id: userId,
              title: `Bugün: ${analysis.title || subject}`,
              reminder_at: morningOf.toISOString(),
              priority: 'normal',
              reference_id: savedEmail.id
            });
          }

        } catch (calErr) {
          console.error("Auto Calendar/Reminder error:", calErr);
        }
      }

      syncedCount++;
    }

    return { success: true, syncedCount };
  } catch (error: any) {
    console.error("Sync Service Error:", error);
    return { success: false, error: error.message };
  }
}
