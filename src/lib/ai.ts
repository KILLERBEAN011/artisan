import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractSearchFilters(userPrompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a helpful assistant for NaijaCraft, a service marketplace in Nigeria. 
Extract search parameters from the user's request into a JSON object.

Allowed fields to return:
- "q": string (free-text keywords like specific tasks, skills, or items like "generator", "logo", "pipes")
- "category": string (must match one of these exact categories if applicable: "Tailoring & Fashion", "Graphic & Web Design", "Home Repair", "Plumbing", "Electrical")
- "location": string (city or area mentioned, e.g., "Yaba", "Lagos", "Ikeja", "Surulere")
- "minPrice": number (if a minimum budget is mentioned in Naira)
- "maxPrice": number (if a maximum budget is mentioned in Naira)

User request: "${userPrompt}"

Return ONLY a valid JSON object with these extracted fields. Do not include markdown code blocks or extra text. If a field cannot be determined, omit it.`,
    });

    const text = response.text ? response.text.trim() : "{}";
    // Clean up any accidental markdown formatting if the model wraps it
    const cleanJson = text.replace(/^```json\s*|\s*```$/g, "");
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI extraction failed:", error);
    return { q: userPrompt }; // Fallback to raw text search if AI fails
  }
}
