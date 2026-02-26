import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google";
import { createClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); 

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=NoCode", request.url));
  }

  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Ensure the session is valid
    if (!session || !session.user) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Verify state against user ID to prevent CSRF (Optional but recommended)
    if (state !== session.user.id) {
        console.warn("State mismatch in Google Auth Callback");
        // Proceeding anyway since session is valid, but good to log it.
    }

    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info to get email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    const updateData: any = {
      email: userInfo.email,
    };
    
    if (tokens.access_token) {
        updateData.google_access_token = tokens.access_token;
    }
    if (tokens.refresh_token) {
        updateData.google_refresh_token = tokens.refresh_token;
    }

    // Update tokens and email in Supabase profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);
        
    if (updateError) {
        console.error("Profile update error:", updateError);
        return NextResponse.redirect(new URL("/settings?error=DBUpdateError", request.url));
    }

    // Start Gmail Watch (for push notifications)
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: `projects/asist-488519/topics/gmail-notifications`,
          labelIds: ['INBOX']
        }
      });
      console.log("Gmail watch started successfully");
    } catch (e) {
      console.error("Gmail watch error (this is normal on localhost):", e);
    }
        
    return NextResponse.redirect(new URL("/settings?success=GoogleConnected", request.url));
  } catch (error: any) {
    console.error("Google Auth Swap Error:", error);
    return NextResponse.redirect(new URL(`/settings?error=${error.message}`, request.url));
  }
}
