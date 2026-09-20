import mongoose, { Schema, model, models } from "mongoose";

const UnlockSchema = new Schema(
  {
    clientEmail: {
      type: String,
      required: true,
    },
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming your artisans are stored in the User collection
      required: true,
    },
    paystackReference: {
      type: String,
      required: true,
      unique: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export const Unlock = models.Unlock || model("Unlock", UnlockSchema);
