import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are all required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    // 10 salt rounds is the standard, safe default for bcrypt.
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: role === "artisan" ? "artisan" : "customer",
    });

    return NextResponse.json(
      { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/auth/signup failed:", error);
    return NextResponse.json(
      { error: "Failed to create account. Check server logs." },
      { status: 500 },
    );
  }
}
