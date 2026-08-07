import { NextResponse } from "next/server";

// Deliberately does NOT touch the database — this only needs to confirm the
// Node process itself is awake and responding, which is all a Render free
// tier needs to stay out of its idle/sleep state. Keeping this cheap means
// UptimeRobot pinging it every few minutes costs nothing meaningful.
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
