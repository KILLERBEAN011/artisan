import mongoose, { Schema, Document, model, models } from "mongoose";

/* ------------------------------------------------------------------ */
/*  Marketplace order                                                    */
/*                                                                      */
/*  One Order = one Paystack payment (one checkout).                    */
/*  It is split into one Shipment per seller, because each seller       */
/*  delivers, gets confirmed and gets paid separately.                  */
/*                                                                      */
/*  Shipment life:                                                      */
/*    awaiting_payment -> paid -> dispatched -> delivered               */
/*                          \-> disputed -> delivered | cancelled       */
/*  Money (payoutStatus):                                               */
/*    pending -> held (paid) -> released (delivered) -> paid_out        */
/*    refunded if cancelled; internal for NaijaCraft Store items        */
/* ------------------------------------------------------------------ */

export const SHIPMENT_STATUSES = [
  "awaiting_payment",
  "paid",
  "dispatched",
  "delivered",
  "disputed",
  "cancelled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const PAYOUT_STATUSES = ["pending", "held", "released", "paid_out", "refunded", "internal"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "amount_mismatch"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  name: string;
  price: number; // Naira, price at time of purchase
  quantity: number;
  image?: string;
  slug?: string;
  options?: { name: string; value: string }[];
}

export interface IShipment {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  official: boolean; // NaijaCraft Store: no commission, no payout
  itemsTotal: number;
  deliveryMethod: string;
  deliveryLabel: string;
  deliveryFee: number;
  deliveryNote?: string;

  status: ShipmentStatus;
  dispatchNote?: string;
  dispatchedAt?: Date;
  autoConfirmAt?: Date;
  deliveredAt?: Date;
  confirmedBy?: "buyer" | "auto" | "admin";

  commissionRate: number; // e.g. 0.05
  commission: number; // Naira kept by NaijaCraft
  sellerAmount: number; // Naira owed to the seller (items - commission + delivery)
  payoutStatus: PayoutStatus;
  releasedAt?: Date;
  paidOutAt?: Date;
  payoutNote?: string;

  dispute?: { reason?: string; openedAt?: Date; resolvedAt?: Date; resolution?: string; note?: string };
  cancelReason?: string;
}

export interface IOrder extends Document {
  buyerId?: mongoose.Types.ObjectId;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  deliveryState?: string;

  items: IOrderItem[];
  shipments: mongoose.Types.DocumentArray<IShipment & mongoose.Types.Subdocument>;

  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  commissionTotal: number;

  paystackReference: string;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  paymentChannel?: string;
  stockIssue?: boolean;
  adminNote?: string;

  schemaVersion: number;

  // Old single-seller fields from before shipments (kept so old data still loads)
  orderStatus?: string;
  payoutStatus?: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  slug: { type: String },
  options: [{ _id: false, name: String, value: String }],
});

const ShipmentSchema = new Schema<IShipment>({
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sellerName: { type: String, default: "" },
  official: { type: Boolean, default: false },
  itemsTotal: { type: Number, required: true, min: 0 },
  deliveryMethod: { type: String, default: "arranged" },
  deliveryLabel: { type: String, default: "" },
  deliveryFee: { type: Number, default: 0, min: 0 },
  deliveryNote: { type: String },

  status: { type: String, enum: SHIPMENT_STATUSES, default: "awaiting_payment" },
  dispatchNote: { type: String, maxlength: 300 },
  dispatchedAt: { type: Date },
  autoConfirmAt: { type: Date },
  deliveredAt: { type: Date },
  confirmedBy: { type: String, enum: ["buyer", "auto", "admin"] },

  commissionRate: { type: Number, default: 0, min: 0, max: 1 },
  commission: { type: Number, default: 0, min: 0 },
  sellerAmount: { type: Number, default: 0, min: 0 },
  payoutStatus: { type: String, enum: PAYOUT_STATUSES, default: "pending" },
  releasedAt: { type: Date },
  paidOutAt: { type: Date },
  payoutNote: { type: String, maxlength: 300 },

  dispute: {
    reason: { type: String, maxlength: 1000 },
    openedAt: { type: Date },
    resolvedAt: { type: Date },
    resolution: { type: String },
    note: { type: String, maxlength: 1000 },
  },
  cancelReason: { type: String, maxlength: 500 },
});

const OrderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    buyerEmail: { type: String, required: true, lowercase: true, trim: true },
    buyerName: { type: String, required: true, trim: true },
    buyerPhone: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },
    deliveryState: { type: String, trim: true },

    items: { type: [OrderItemSchema], default: [] },
    shipments: { type: [ShipmentSchema], default: [] },

    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    commissionTotal: { type: Number, default: 0, min: 0 },

    paystackReference: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pending", index: true },
    paidAt: { type: Date },
    paymentChannel: { type: String },
    stockIssue: { type: Boolean, default: false },
    adminNote: { type: String, maxlength: 1000 },

    schemaVersion: { type: Number, default: 2 },

    orderStatus: { type: String },
    payoutStatus: { type: String },
  },
  { timestamps: true },
);

OrderSchema.index({ "shipments.sellerId": 1, createdAt: -1 });
OrderSchema.index({ "shipments.status": 1, "shipments.autoConfirmAt": 1 });
OrderSchema.index({ "shipments.payoutStatus": 1 });

export const Order = (models.Order as mongoose.Model<IOrder>) || model<IOrder>("Order", OrderSchema);
