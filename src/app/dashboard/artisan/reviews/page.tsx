import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import "@/models/User"; // Ensure User model is loaded for population

export default async function ArtisanReviewsPage() {
  const session = await auth();
  if (!session || session.user.role !== "artisan") {
    redirect("/login");
  }

  await connectToDatabase();

  // Find the logged-in artisan's profile
  const profile = await ArtisanProfile.findOne({
    userId: session.user.id,
  }).lean();

  if (!profile) {
    return <p className="text-sm text-ink-600">Profile not found.</p>;
  }

  // Fetch all completed bookings that have a rating attached
  const reviewedBookings = await Booking.find({
    artisanId: profile._id,
    rating: { $exists: true, $ne: null },
  })
    .populate("customerId", "name")
    .sort({ reviewedAt: -1, createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            See what customers are saying about your work.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold text-navy-900">
            ★ {profile.rating ? profile.rating.toFixed(1) : "0.0"}
          </p>
          <p className="text-xs text-ink-500">Overall Rating</p>
        </div>
      </div>

      <div className="rounded-2xl border border-cloud-200 bg-white p-6 shadow-sm">
        {reviewedBookings.length === 0 ? (
          <div className="py-12 text-center text-ink-500">
            <Star className="mx-auto mb-3 h-8 w-8 text-cloud-300" />
            {/* FIX 1: Escaped the apostrophe in "don't" */}
            <p>You don&apos;t have any reviews yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 divide-y divide-cloud-100">
            {/* FIX 2: Replaced 'any' with a proper type definition */}
            {reviewedBookings.map(
              (booking: {
                _id: { toString: () => string };
                customerId?: { name: string };
                rating: number;
                title: string;
                reviewedAt?: Date;
                createdAt: Date;
                review?: string;
              }) => (
                <div key={booking._id.toString()} className="pt-6 first:pt-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-navy-900">
                      {booking.customerId?.name || "Customer"}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-brand-amber-500 text-brand-amber-500" />
                      <span className="text-sm font-bold text-navy-900">
                        {booking.rating}/5
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Job: {booking.title} •{" "}
                    {new Date(
                      booking.reviewedAt || booking.createdAt,
                    ).toLocaleDateString()}
                  </p>
                  {booking.review && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-700">
                      {/* FIX 3: Escaped the double quotes */}
                      &quot;{booking.review}&quot;
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
