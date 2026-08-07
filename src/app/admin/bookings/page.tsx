import Link from "next/link";
import { Banknote } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import "@/models/User";
import "@/models/ArtisanProfile";
import { ReleaseFundsButton } from "@/components/admin/ReleaseFundsButton";

export default async function AdminBookingsPage() {
  await connectToDatabase();

  const bookings = await Booking.find({ status: "completed", escrowFunded: true })
    .populate("customerId", "name")
    .populate({
      path: "artisanId",
      select: "serviceTitle userId bankDetails",
      populate: { path: "userId", select: "name" },
    })
    .sort({ paidAt: -1 })
    .lean();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy-900">Completed Bookings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Jobs the customer has confirmed complete and paid for. Release funds once you&rsquo;ve
        handled the actual bank transfer to the artisan.
      </p>

      <div className="mt-5 space-y-3">
        {bookings.length === 0 ? (
          <p className="rounded-2xl border border-cloud-200 bg-white p-6 text-center text-sm text-ink-500">
            No completed, paid bookings yet.
          </p>
        ) : (
          bookings.map((booking) => {
            const customer = booking.customerId as unknown as { name?: string } | null;
            const artisan = booking.artisanId as unknown as {
              userId?: { name?: string };
              serviceTitle?: string;
              bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string };
            } | null;
            const bank = artisan?.bankDetails;
            const hasBankDetails = !!(bank?.bankName && bank?.accountNumber);

            return (
              <div
                key={booking._id.toString()}
                className="flex flex-col gap-3 rounded-2xl border border-cloud-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/bookings/${booking._id}`}
                        className="font-semibold text-navy-900 hover:text-brand-green-600"
                      >
                        {booking.title}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          booking.payoutStatus === "released"
                            ? "bg-brand-green-100 text-brand-green-700"
                            : "bg-brand-amber-100 text-brand-amber-600"
                        }`}
                      >
                        {booking.payoutStatus === "released" ? "Released" : "Pending payout"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      Customer: {customer?.name ?? "Unknown"} · Artisan:{" "}
                      {artisan?.userId?.name ?? "Unknown"}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Paid{" "}
                      {booking.paidAt
                        ? new Date(booking.paidAt).toLocaleDateString("en-NG")
                        : "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-display text-lg font-bold text-navy-900">
                      NGN {booking.amountNaira.toLocaleString()}
                    </p>
                    {booking.payoutStatus !== "released" && (
                      <ReleaseFundsButton bookingId={booking._id.toString()} />
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-cloud-50 p-3">
                  <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                  {hasBankDetails ? (
                    <p className="text-sm text-ink-700">
                      <span className="font-semibold text-navy-900">{bank!.bankName}</span> ·{" "}
                      {bank!.accountNumber} · {bank!.accountName}
                    </p>
                  ) : (
                    <p className="text-sm text-brand-amber-600">
                      This artisan hasn&rsquo;t added bank details yet — contact them before
                      releasing funds.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
