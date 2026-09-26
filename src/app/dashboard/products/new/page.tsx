"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Fashion",
    description: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to list a product.");
      return;
    }

    if (!imageFile) {
      toast.error("Please select an image for your product.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload image directly to Cloudinary
      const imageData = new FormData();
      imageData.append("file", imageFile);
      // Ensure these exactly match the variables in your Render/Local .env file
      imageData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: imageData },
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) {
        throw new Error(
          (cloudinaryData as any).error?.message ||
            "Failed to upload image to Cloudinary.",
        );
      }

      const imageUrl = cloudinaryData.secure_url;

      // 2. Save the product to MongoDB
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          category: form.category,
          description: form.description,
          images: [imageUrl],
          // Dynamically attach the product to the logged-in user
          sellerId: user._id || user.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Product listed successfully!");

        // Wait 1.5 seconds so the user can read the success message before it redirects
        setTimeout(() => {
          router.push("/marketplace");
        }, 1500);
      } else {
        toast.error(data.error || "Failed to list product.");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 bg-white rounded-xl shadow-sm border border-gray-100 my-8">
      {/* Invisible container that renders the beautiful popups */}
      <Toaster position="top-center" reverseOrder={false} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          List an Item for Sale
        </h1>
        <p className="text-gray-500 text-sm">
          Upload a physical product to the marketplace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <div className="relative flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 hover:bg-gray-50 transition-colors">
            {imagePreview ? (
              <div className="relative h-48 w-full max-w-xs overflow-hidden rounded-md">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-sm hover:bg-red-600"
                >
                  <span className="sr-only">Remove</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon
                  className="mx-auto h-12 w-12 text-gray-300"
                  aria-hidden="true"
                />
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-brand-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-green-600 focus-within:ring-offset-2 hover:text-brand-green-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
            placeholder="e.g., Apple AirPods Pro"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₦)
            </label>
            <input
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
            >
              <option value="Fashion">Thrift & Fashion</option>
              <option value="Gadgets">Gadgets & Accessories</option>
              <option value="Food">Baked Goods & Food</option>
              <option value="Services">Spare Materials</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
            placeholder="Describe the condition, size, or any other important details for the buyer..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Publish Product
            </>
          )}
        </button>
      </form>
    </div>
  );
}
