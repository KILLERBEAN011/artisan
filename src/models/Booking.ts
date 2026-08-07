import { Schema, model, models, type InferSchemaType } from "mongoose";

const bookingSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    artisanId: {
      type: Schema.Types.ObjectId,
      ref: "ArtisanProfile",
      required: true,
      index: true,
    },

    title: { type: String, required: true }, // e.g. "Electrical rewiring — apartment A2"

    status: {
      type: String,
      enum: [
        "awaiting-quote", // customer requested, artisan hasn't quoted yet
        "quote-sent", // artisan sent a price, waiting on customer
        "scheduled", // customer accepted, job is on the calendar
        "in-progress", // artisan is actively working
        "completed", // customer marked job done, funds released
        "disputed", // either party raised an issue
      ],
      default: "awaiting-quote",
      required: true,
    },

    amountNaira: { type: Number, default: 0 },
    scheduledFor: { type: Date },

    // Simple escrow flag for now — a real payment integration (Paystack/Flutterwave)
    // would replace this with a proper transaction reference.
    escrowFunded: { type: Boolean, default: false },
    paymentReference: { type: String }, // Paystack transaction reference, once paid
    paidAt: { type: Date },

    // Tracks whether the held funds have actually been paid out to the
    // artisan yet. Release is a manual admin action for now.
    payoutStatus: { type: String, enum: ["pending", "released"], default: "pending" },
    payoutReleasedAt: { type: Date },
  },
  { timestamps: true },
);

export type BookingDoc = InferSchemaType<typeof bookingSchema>;

export const Booking = models.Booking || model("Booking", bookingSchema);
