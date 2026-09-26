import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  inStock: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    images: [{ type: String, required: true }],
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product =
  models.Product || model<IProduct>("Product", ProductSchema);
