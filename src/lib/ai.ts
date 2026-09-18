import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractSearchFilters(userPrompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the NaijaCraft AI Assistant.
Analyze the user's request and output a valid JSON object.

Determine if the user's intent is "search" (hiring an artisan) or "chat" (asking for help/guidance).

IF INTENT IS "search" (e.g., "I need an electrician in Lagos"):
Return exactly this JSON format:
{
  "intent": "search",
  "chatResponse": "",
  "searchFilters": {
    "q": "<extract ONLY the core skill or profession, e.g. 'electrician'>",
    "location": "<extract city/state if mentioned, e.g. 'Lagos'>"
  }
}

IF INTENT IS "chat" (e.g., "How do I register as an artisan?"):
Return exactly this JSON format:
{
  "intent": "chat",
  "chatResponse": "<write a helpful, step-by-step guide answering their question>",
  "searchFilters": {}
}

User request: "${userPrompt}"`,
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = response.text ? response.text.trim() : "{}";

    // Strip out any accidental markdown formatting
    text = text
      .replace(/^```(json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    return JSON.parse(text);
  } catch (error: unknown) {
    console.error("AI extraction failed:", error);
    const err = error as { status?: number; message?: string };

    // Safety net for high traffic
    if (
      err?.status === 503 ||
      err?.message?.toLowerCase().includes("unavailable") ||
      err?.message?.toLowerCase().includes("high demand")
    ) {
      return {
        intent: "chat",
        chatResponse:
          "I'm experiencing high network traffic right now! Please wait a moment and try asking again.",
      };
    }

    // Standard fallback
    return {
      intent: "search",
      searchFilters: { q: userPrompt },
      chatResponse: "",
    };
  }
}
