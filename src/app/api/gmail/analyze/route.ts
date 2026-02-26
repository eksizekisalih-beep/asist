
import { NextResponse } from "next/server";
import { getRecentEmails } from "@/lib/google-service";
import { getGoogleOAuthClient } from "@/lib/google";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase-server";

// Gmail'den önemli mailleri ayıklayıp özetleyen endpoint
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const emails = await getRecentEmails();
    
    // Basit bir filtreleme: Başlığında "fatura", "ödeme", "toplantı", "onay" geçenleri "önemli" say
    const importantKeywords = ["invoice", "fatura", "payment", "ödeme", "meeting", "toplantı", "confirm", "onay"];
    
    const analysis = emails.map(email => {
      const isImportant = importantKeywords.some(key => 
        email.subject?.toLowerCase().includes(key) || 
        email.snippet?.toLowerCase().includes(key)
      );
      
      return {
        ...email,
        isImportant,
        actionRecommended: isImportant ? "Hatırlatıcı oluşturulabilir" : "Aksiyon gerekmiyor"
      };
    });

    return NextResponse.json({ analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
