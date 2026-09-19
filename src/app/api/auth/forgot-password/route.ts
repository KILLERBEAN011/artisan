import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    // For security, do not reveal if the user does not exist.
    // Simply return a generic success message.
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link was sent." },
        { status: 200 },
      );
    }

    // Generate a secure 32-byte token and set expiration to 1 hour
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.forgotPasswordToken = resetToken;
    user.forgotPasswordTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: "support@naijacraft.com.ng", // Ensure this matches your verified Resend domain
      to: email,
      subject: "Reset your NaijaCraft Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password for your NaijaCraft account.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Reset Password
          </a>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Reset link sent successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Something went wrong while processing your request." },
      { status: 500 },
    );
  }
}
