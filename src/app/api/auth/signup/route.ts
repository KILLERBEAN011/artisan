import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
// Import your database connection and User model here
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();
    await connectToDatabase();

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use." },
        { status: 400 },
      );
    }

    // 2. Hash password and generate a secure 32-byte verification token
    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // Set token expiry to 24 hours from now
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3. Save the new user to MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verifyToken,
      verifyTokenExpiry,
    });

    // 4. Send the verification email via Resend
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verifyemail?token=${verifyToken}`;

    await resend.emails.send({
      from: "onboarding@naijacraft.com.ng", // Must be your verified domain in Resend
      to: email,
      subject: "Verify your NaijaCraft Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to NaijaCraft, ${name}!</h2>
          <p>Please verify your email address to activate your account and start connecting with local clients and artisans.</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Verify Email Address
          </a>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">This link expires in 24 hours.</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Account created. Please check your email to verify." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: "Something went wrong during signup." },
      { status: 500 },
    );
  }
}
