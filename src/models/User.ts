import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["customer", "artisan", "admin"],
      required: true,
      default: "customer",
    },
    // In a real signup flow this would be a bcrypt hash, never a plain password.
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

// `models.User` re-uses an already-compiled model if one exists (prevents
// "Cannot overwrite model" errors during Next.js hot reload).
export const User = models.User || model("User", userSchema);
