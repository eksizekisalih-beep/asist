
import { NextResponse } from "next/server";
import { syncUserEmails } from "@/lib/sync-service";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Google Pub/Sub sends data in a 'message' object, and the actual content is base64 encoded
    // Format: { message: { data: "base64_encoded_json", ... } }
    if (!body.message || !body.message.data) {
      console.log("Invalid Pub/Sub message format");
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const decodedData = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    const emailAddress = decodedData.emailAddress;

    if (!emailAddress) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Find the user with this email in our profiles (via OAuth or stored email)
    // For simplicity, let's assume the user is what Google says. 
    // In a production app, we would look up the user by email in Supabase.
    
    const supabase = await createClient();
    // We need to find the profile where google credentials match or email matches
    // Note: We might need to store the email in the profile during OAuth to make this lookup easy.
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", emailAddress) // This assumes we save the user's email in profiles
      .single();

    if (profile) {
      console.log(`Webhook triggered for user: ${emailAddress} (${profile.id})`);
      // Trigger sync for this specific user
      await syncUserEmails(profile.id);
    } else {
      console.log(`No profile found for email: ${emailAddress}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gmail Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 200 }); // Always return 200 to Google to avoid retry loops
  }
}
