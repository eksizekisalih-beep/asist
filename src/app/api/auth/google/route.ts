import { NextResponse } from "next/server";
import { getGoogleOAuthClient, SCOPES } from "@/lib/google";
import { createClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const oauth2Client = getGoogleOAuthClient();

    // Generate a url that asks permissions for the defined scopes
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent", // Force to re-consent to assure we get a refresh_token
      state: session.user.id, 
    });

    return NextResponse.redirect(url);
  } catch (err: any) {
    console.error("Google Auth Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
