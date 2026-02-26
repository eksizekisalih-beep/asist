
import { google } from "googleapis";
import { getGoogleOAuthClient } from "./google";
import { createClient } from "./supabase-server";

export async function getCalendarEvents() {
  const supabase = await createClient();
  const { data: { user: session } } = await supabase.auth.getUser();

  if (!session) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token")
    .eq("id", session.id)
    .single();

  if (!profile?.google_access_token) return [];

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  
  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Google Calendar API Error:", error);
    return [];
  }
}

export async function createCalendarEvent(title: string, startTime: string) {
  const supabase = await createClient();
  const { data: { user: session } } = await supabase.auth.getUser();

  if (!session) throw new Error("Oturum bulunamadı");

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token")
    .eq("id", session.id)
    .single();

  if (!profile?.google_access_token) throw new Error("Google bağlı değil");

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  
  const end = new Date(startTime);
  end.setHours(end.getHours() + 1); // Varsayılan 1 saatlik etkinlik

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        start: { dateTime: new Date(startTime).toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });
    return response.data;
  } catch (error) {
    console.error("Google Calendar Insert Error:", error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user: session } } = await supabase.auth.getUser();

  if (!session) throw new Error("Oturum bulunamadı");

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token")
    .eq("id", session.id)
    .single();

  if (!profile?.google_access_token) throw new Error("Google bağlı değil");

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  
  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error("Google Calendar Delete Error:", error);
    throw error;
  }
}

export async function updateCalendarEvent(eventId: string, title: string, startTime: string) {
  const supabase = await createClient();
  const { data: { user: session } } = await supabase.auth.getUser();

  if (!session) throw new Error("Oturum bulunamadı");

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token")
    .eq("id", session.id)
    .single();

  if (!profile?.google_access_token) throw new Error("Google bağlı değil");

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  
  const end = new Date(startTime);
  end.setHours(end.getHours() + 1);

  try {
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      requestBody: {
        summary: title,
        start: { dateTime: new Date(startTime).toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });
    return response.data;
  } catch (error) {
    console.error("Google Calendar Update Error:", error);
    throw error;
  }
}

export async function getRecentEmails() {
  const supabase = await createClient();
  const { data: { user: session } } = await supabase.auth.getUser();

  if (!session) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token")
    .eq("id", session.id)
    .single();

  if (!profile?.google_access_token) return [];

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  
  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
      q: "is:unread"
    });

    const messages = response.data.messages || [];
    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        const details = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
        });
        const headers = details.data.payload?.headers;
        return {
          id: msg.id,
          snippet: details.data.snippet,
          subject: headers?.find(h => h.name === "Subject")?.value,
          from: headers?.find(h => h.name === "From")?.value,
        };
      })
    );

    return detailedMessages;
  } catch (error) {
    console.error("Gmail API Error:", error);
    return [];
  }
}
