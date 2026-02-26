import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { emailId, body } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token')
      .eq('id', user.id)
      .single();

    if (!profile?.google_access_token) throw new Error("Google account not connected");

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token: profile.google_access_token,
      refresh_token: profile.google_refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 1. Get original message to reply to
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: emailId
    });

    const headers = originalMessage.data.payload?.headers;
    const subject = headers?.find(h => h.name === 'Subject')?.value || '';
    const messageId = headers?.find(h => h.name === 'Message-ID')?.value || '';
    const from = headers?.find(h => h.name === 'From')?.value || '';
    const threadId = originalMessage.data.threadId;

    // 2. Draft the reply
    const raw = [
      `To: ${from}`,
      `Subject: Re: ${subject}`,
      `In-Reply-To: ${messageId}`,
      `References: ${messageId}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      body
    ].join('\r\n');

    const encodedMessage = Buffer.from(raw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gmail Reply Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
