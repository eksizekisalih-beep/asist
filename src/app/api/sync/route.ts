
import { NextResponse } from "next/server";
import { syncUserEmails } from "@/lib/sync-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await syncUserEmails();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sync Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
