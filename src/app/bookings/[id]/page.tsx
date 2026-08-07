import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import "@/models/User";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { QuoteActions } from "@/components/chat/QuoteActions";
import { PaymentButton } from "@/components/chat/PaymentButton";
import { MarkCompleteButton } from "@/components/chat/MarkCompleteButton";
import { StatusPill } from "@/components/dashboard/StatusPill";
import type { JobStatus } from "@/types/dashboard";

export default async function BookingChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  await connectToDatabase();

  const booking = await Booking.findById(id)
    .populate("customerId", "name")
    .populate({
      path: "artisanId",
      select: "serviceTitle userId",
      populate: { path: "userId", select: "name" },
    })
    .lean();

  if (!booking) {
    notFound();
  }

  const customer = booking.customerId as unknown as {
    _id: { toString(): string };
    name: string;
  };
  const artisanProfile = booking.artisanId as unknown as {
    _id: { toString(): string };
    serviceTitle: string;
    userId?: { name?: string };
  };

  const isCustomer =
    session.user.role === "customer" && customer._id.toString() === session.user.id;

  let isArtisan = false;
  if (session.user.role === "artisan") {
    const myProfile = await ArtisanProfile.findOne({ userId: session.user.id })
      .select("_id")
      .lean();
    isArtisan = !!myProfile && myProfile._id.toString() === artisanProfile._id.toString();
  }

  if (!isCustomer && !isArtisan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cloud-50 px-4">
        <p className="text-sm text-ink-700">You don&rsquo;t have access to this conversation.</p>
      </main>
    );
  }

  const counterpartyName = isCustomer ? (artisanProfile.userId?.name ?? "Artisan") : customer.name;
  const backHref = isCustomer ? "/dashboard/customer" : "/dashboard/artisan";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 hover:text-brand-green-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cloud-200 bg-white p-4">
        <div>
          <h1 className="font-display text-lg font-bold text-navy-900">{booking.title}</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            {isCustomer ? "Artisan" : "Customer"}: {counterpartyName}
          </p>
        </div>
        <StatusPill status={booking.status as JobStatus} />
      </div>

      <QuoteActions
        bookingId={id}
        viewerRole={isCustomer ? "customer" : "artisan"}
        status={booking.status}
        amountNaira={booking.amountNaira}
      />

      {booking.status === "scheduled" && (
        <div className="mb-4 rounded-2xl border border-cloud-200 bg-white p-4">
          {booking.escrowFunded ? (
            <div className="flex items-center gap-2 text-brand-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Payment confirmed</p>
                <p className="text-xs text-ink-500">
                  NGN {booking.amountNaira.toLocaleString()} paid
                  {booking.paidAt
                    ? ` on ${new Date(booking.paidAt).toLocaleDateString("en-NG")}`
                    : ""}
                  . Held until the job is marked complete.
                </p>
              </div>
            </div>
          ) : isCustomer ? (
            <>
              <h2 className="font-display text-sm font-bold text-navy-900">Pay for this job</h2>
              <p className="mt-1 text-sm text-ink-500">
                Your payment is held securely until the job is done.
              </p>
              <div className="mt-3">
                <PaymentButton
                  bookingId={id}
                  amountNaira={booking.amountNaira}
                  customerEmail={session.user.email ?? ""}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-500">Waiting on the customer to pay.</p>
          )}
        </div>
      )}

      <MarkCompleteButton
        bookingId={id}
        viewerRole={isCustomer ? "customer" : "artisan"}
        status={booking.status}
        escrowFunded={booking.escrowFunded}
      />

      {booking.status === "completed" && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-brand-green-100 bg-brand-green-100/40 p-4 text-brand-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">Job completed</p>
            <p className="text-xs text-ink-500">
              {booking.payoutStatus === "released"
                ? "Funds have been released to the artisan."
                : "Payout to the artisan is pending admin review."}
            </p>
          </div>
        </div>
      )}

      <ChatPanel bookingId={id} currentUserId={session.user.id} />
    </main>
  );
}
