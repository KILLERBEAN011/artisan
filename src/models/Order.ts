import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  sellerId: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  buyerId?: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paystackReference: string;
  orderStatus: "paid" | "processing" | "dispatched" | "delivered" | "cancelled";
  payoutStatus: "held_in_escrow" | "paid_to_seller" | "released" | "paid_out";
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    buyerId: { type: String, required: false },
    buyerEmail: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paystackReference: { type: String, required: true, unique: true },
    orderStatus: {
      type: String,
      enum: ["paid", "processing", "dispatched", "delivered", "cancelled"],
      default: "paid",
    },
    payoutStatus: {
      type: String,
      enum: ["held_in_escrow", "paid_to_seller", "released", "paid_out"],
      default: "held_in_escrow",
    },
  },
  { timestamps: true },
);

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
