import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-1.5-flash";

const getModel = (customKey?: string) => {
  const apiKey = customKey || "";
  if (!apiKey) {
    throw new Error("Yapay zeka anahtarı (API Key) bulunamadı. Lütfen Ayarlar sayfasından kendi anahtarınızı tanımlayın.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: DEFAULT_MODEL,
    systemInstruction: `Senin adın asist. Sen akıllı, yardımsever ve profesyonel bir yapay zeka asistanısın. 
    
    KRİTİK KURALLAR:
    1. ASLA KENDİNDEN GOOGLE TARAFINDAN EĞİTİLMİŞ BİR MODEL OLARAK BAHSETME.
    2. ASLA VERİ UYDURMA (HALLUCINATION). Eğer sana [GERÇEK VERİ] veya [SİSTEM BİLGİSİ] olarak sunulmayan bir bilgi istenirse (fatura, e-posta, randevu vb.), "Henüz sistemde böyle bir kayıt bulamadım" de. 
    3. ASLA Turkcell, Enerjisa, Netflix gibi örnek verileri "gerçekmiş gibi" kullanıcıya sunma. Sadece sana sağlanan metindeki verileri kullan.
    4. Kullanıcıya isminin asist olduğunu ve verimlilik asistanı olduğunu söyle.`
  });
};


export const analyzeDocument = async (base64Image: string, prompt: string, customKey?: string) => {
  try {
    const model = getModel(customKey);
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const chatWithAI = async (history: any[], message: string, onUpdate?: (text: string) => void, customKey?: string) => {
  try {
    const model = getModel(customKey);
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    if (onUpdate) {
      const result = await chat.sendMessageStream(message);
      let text = "";
      for await (const chunk of result.stream) {
        text += chunk.text();
        onUpdate(text);
      }
      return text;
    }

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const classifyEmail = async (emailSnippet: string, customKey?: string) => {
  try {
    const model = getModel(customKey);
    const now = new Date().toISOString();
    const prompt = `
      Aşağıdaki e-posta içeriğini analiz et ve JSON formatında geri dön.
      Şu anki gerçek zaman: ${now}

      E-posta: "${emailSnippet}"
      
      Kriterler:
      1. Bu mail önemli bir bildirim, fatura, randevu veya görev içeriyor mu? (isImportant: boolean)
      2. Eğer bir randevu/toplantı ise tarih ve saatini ayıkla. Eğer yıl belirtilmemişse 2026 olarak varsay (appointmentDate: ISO string veya null)
      3. Kısa bir özet çıkar (summary: string)
      4. Eğer bir aksiyon gerekiyorsa belirt (action: "add_calendar", "pay_invoice", "none")
      5. Başlık önerisi (title: string)

      SADECE JSON döndür. Başka hiçbir metin ekleme.
      Örnek format: {"isImportant": true, "appointmentDate": "2026-MM-DDTHH:mm:ss", "summary": "...", "action": "add_calendar", "title": "..."}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Email Classification Error:", error);
    return { isImportant: false, summary: "Analiz edilemedi", action: "none" };
  }
};
