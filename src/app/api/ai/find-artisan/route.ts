import { NextRequest, NextResponse } from "next/server";
import { extractSearchFilters } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt is required." },
        { status: 400 },
      );
    }

    // Securely call the AI utility on the server to extract structured parameters
    const searchParams = await extractSearchFilters(prompt);

    // Return the extracted JSON safely to the frontend
    return NextResponse.json(searchParams, { status: 200 });
  } catch (error) {
    console.error("AI Find Artisan Error:", error);
    return NextResponse.json(
      { error: "Failed to process the AI request." },
      { status: 500 },
    );
  }
}
