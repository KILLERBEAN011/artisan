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
import { LeaveReviewButton } from "@/components/chat/LeaveReviewButton";
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
    session.user.role === "customer" &&
    customer._id.toString() === session.user.id;

  let isArtisan = false;
  if (session.user.role === "artisan") {
    const myProfile = await ArtisanProfile.findOne({ userId: session.user.id })
      .select("_id")
      .lean();
    isArtisan =
      !!myProfile && myProfile._id.toString() === artisanProfile._id.toString();
  }

  if (!isCustomer && !isArtisan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cloud-50 px-4 transition-colors dark:bg-[#101D3F]">
        <p className="text-sm text-ink-700 transition-colors dark:text-ink-300">
          You don&rsquo;t have access to this conversation.
        </p>
      </main>
    );
  }

  const counterpartyName = isCustomer
    ? (artisanProfile.userId?.name ?? "Artisan")
    : customer.name;
  const backHref = isCustomer ? "/dashboard/customer" : "/dashboard/artisan";

  return (
    <main className="min-h-screen bg-cloud-50 pb-12 pt-8 transition-colors dark:bg-[#101D3F]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 transition-colors hover:text-brand-green-700 dark:text-brand-green-500 dark:hover:text-brand-green-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_350px] xl:gap-10">
          <div className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-cloud-200 bg-white shadow-sm transition-colors dark:border-navy-700 dark:bg-[#17264a]">
            <ChatPanel bookingId={id} currentUserId={session.user.id} />
          </div>

          <div className="sticky top-24 flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-cloud-200 bg-white p-5 shadow-sm transition-colors dark:border-navy-700 dark:bg-[#17264a]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-lg font-bold leading-tight text-navy-900 transition-colors dark:text-white">
                    {booking.title}
                  </h1>
                  <p className="mt-1.5 text-sm text-ink-500 transition-colors dark:text-ink-300">
                    {isCustomer ? "Artisan" : "Customer"}:{" "}
                    <span className="font-medium text-navy-900 transition-colors dark:text-white">
                      {counterpartyName}
                    </span>
                  </p>
                </div>
                <StatusPill status={booking.status as JobStatus} />
              </div>
            </div>

            <QuoteActions
              bookingId={id}
              viewerRole={isCustomer ? "customer" : "artisan"}
              status={booking.status}
              amountNaira={booking.amountNaira}
            />

            {booking.status === "scheduled" && (
              <div className="rounded-2xl border border-cloud-200 bg-white p-5 shadow-sm transition-colors dark:border-navy-700 dark:bg-[#17264a]">
                {booking.escrowFunded ? (
                  <div className="flex items-start gap-3 text-brand-green-700 dark:text-brand-green-400">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Payment confirmed</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-300">
                        NGN {booking.amountNaira.toLocaleString()} paid
                        {booking.paidAt
                          ? ` on ${new Date(booking.paidAt).toLocaleDateString("en-NG")}`
                          : ""}
                        . Held in escrow until the job is marked complete.
                      </p>
                    </div>
                  </div>
                ) : isCustomer ? (
                  <>
                    <h2 className="font-display text-sm font-bold text-navy-900 transition-colors dark:text-white">
                      Pay for this job
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500 transition-colors dark:text-ink-300">
                      Your payment is held securely until the job is done.
                    </p>
                    <div className="mt-4">
                      <PaymentButton
                        bookingId={id}
                        amountNaira={booking.amountNaira}
                        customerEmail={session.user.email ?? ""}
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-cloud-50 p-4 transition-colors dark:bg-navy-800">
                    <p className="text-sm text-ink-600 transition-colors dark:text-ink-300">
                      Waiting for the customer to fund escrow.
                    </p>
                  </div>
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
              <div className="flex flex-col gap-4 rounded-2xl border border-brand-green-100 bg-brand-green-50 p-5 text-brand-green-800 transition-colors dark:border-brand-green-900/50 dark:bg-brand-green-900/20 dark:text-brand-green-400">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Job completed</p>
                    <p className="mt-1 text-xs leading-relaxed text-brand-green-700/80 dark:text-brand-green-400/80">
                      {booking.payoutStatus === "released"
                        ? "Funds have been released to the artisan."
                        : "Payout to the artisan is currently pending admin review."}
                    </p>
                  </div>
                </div>

                {isCustomer && !booking.rating && (
                  <div className="mt-2 border-t border-brand-green-200/60 pt-4 dark:border-brand-green-900/50">
                    <LeaveReviewButton bookingId={id} />
                  </div>
                )}
                {booking.rating && (
                  <div className="mt-2 border-t border-brand-green-200/60 pt-4 dark:border-brand-green-900/50">
                    <p className="text-sm font-semibold text-brand-green-800 dark:text-brand-green-400">
                      ★ {booking.rating}/5 Review Submitted
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 rounded-xl bg-navy-50 p-4 transition-colors dark:bg-navy-900/50">
              <p className="text-xs font-medium leading-relaxed text-navy-800 transition-colors dark:text-navy-100">
                <span className="font-bold">🛡️ NaijaCraft Protection:</span>{" "}
                Keep all payments on the platform to remain covered by our job
                guarantee. Never transfer money directly to bank accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
