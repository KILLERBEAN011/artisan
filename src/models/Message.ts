import { Schema, model, models, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

export type MessageDoc = InferSchemaType<typeof messageSchema>;

export const Message = models.Message || model("Message", messageSchema);
