import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

// Dynamically reference the User model to avoid import path issues
const User =
  mongoose.models.User ||
  mongoose.model("User", new mongoose.Schema({}, { strict: false }));

// GET: Fetch products for the marketplace or a specific seller
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    await connectToDatabase();

    const query = sellerId ? { sellerId, inStock: true } : { inStock: true };

    // .lean() converts Mongoose documents to plain JavaScript objects so we can add new fields to them
    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    // 1. Extract all unique seller IDs from the fetched products
    const sellerIds = [...new Set(products.map((p) => p.sellerId))];

    // 2. Fetch the corresponding user profiles for those sellers
    const sellers = await User.find({ _id: { $in: sellerIds } }).lean();

    // 3. Create a dictionary to map seller IDs to their names for fast lookup
    const sellerMap = sellers.reduce(
      (
        acc: Record<string, string>,
        seller: { _id: mongoose.Types.ObjectId; name?: string },
      ) => {
        acc[seller._id.toString()] = seller.name || "NaijaCraft Artisan";
        return acc;
      },
      {},
    );

    // 4. Attach the seller's name to each product object
    const productsWithSellers = products.map((product) => ({
      ...product,
      sellerName: sellerMap[product.sellerId] || "NaijaCraft Artisan",
    }));

    return NextResponse.json(
      { products: productsWithSellers },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products from the marketplace." },
      { status: 500 },
    );
  }
}

// POST: Create a new physical product listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, category, images, sellerId } = body;

    if (
      !name ||
      !price ||
      !category ||
      !images ||
      images.length === 0 ||
      !sellerId
    ) {
      return NextResponse.json(
        { error: "Missing required product fields or seller ID." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const newProduct = await Product.create({
      sellerId,
      name,
      description,
      price: Number(price),
      category,
      images,
      inStock: true,
    });

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Create Product Error:", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the product." },
      { status: 500 },
    );
  }
}
// DELETE: Permanently remove a product listing
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Product deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete Product Error:", error);
    return NextResponse.json(
      { error: "Failed to delete the product." },
      { status: 500 },
    );
  }
}