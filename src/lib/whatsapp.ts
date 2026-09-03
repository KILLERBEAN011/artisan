// src/lib/whatsapp.ts

export async function sendWhatsAppAlert(to: string, message: string) {
  // We pull your Termii keys from your .env.local file
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "N-Craft";

  if (!apiKey) {
    console.warn(
      "⚠️ TERMII_API_KEY is missing in .env.local. Skipping WhatsApp alert.",
    );
    return false;
  }

  try {
    const response = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: to,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "whatsapp", // This tells Termii to route it through WhatsApp
        api_key: apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Termii API Error:", data);
      return false;
    }

    console.log("✅ WhatsApp message sent successfully:", data);
    return true;
  } catch (error) {
    console.error("❌ Failed to ping Termii:", error);
    return false;
  }
}
