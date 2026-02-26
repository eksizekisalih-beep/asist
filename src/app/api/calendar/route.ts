
import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-service";

export async function POST(request: Request) {
  try {
    const { title, date } = await request.json();

    if (!title || !date) {
      return NextResponse.json({ error: "Eksik bilgi: title ve date gerekli." }, { status: 400 });
    }

    const event = await createCalendarEvent(title, date);
    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Calendar Action API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
