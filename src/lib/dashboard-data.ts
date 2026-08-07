import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ArtisanProfile } from "@/models/ArtisanProfile";
// Imported so Mongoose registers the "User" model — required for the
// populate() calls below to resolve names, even though we never call User directly.
import "@/models/User";
import type { DashboardJob, DashboardStat, JobStatus } from "@/types/dashboard";

function formatDateLabel(date: Date, prefix: string): string {
  const formatted = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  return `${prefix} ${formatted}`;
}

export async function getCustomerDashboardData(customerId: string) {
  await connectToDatabase();

  const bookings = await Booking.find({ customerId })
    .populate({
      path: "artisanId",
      select: "serviceTitle userId",
      populate: { path: "userId", select: "name" },
    })
    .sort({ createdAt: -1 })
    .lean();

  const jobs: DashboardJob[] = bookings.map((booking) => {
    const artisan = booking.artisanId as unknown as {
      userId?: { name?: string };
    } | null;

    return {
      id: booking._id.toString(),
      title: booking.title,
      counterpartyName: artisan?.userId?.name ?? "Artisan",
      status: booking.status as JobStatus,
      dateLabel: booking.scheduledFor
        ? formatDateLabel(new Date(booking.scheduledFor), "Scheduled for")
        : formatDateLabel(new Date(booking.createdAt), "Requested"),
      amountNaira: booking.amountNaira,
    };
  });

  const activeCount = jobs.filter(
    (j) => j.status === "scheduled" || j.status === "in-progress",
  ).length;
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const totalSpent = completedJobs.reduce((sum, j) => sum + j.amountNaira, 0);

  const stats: DashboardStat[] = [
    { label: "Active jobs", value: String(activeCount), helpText: "Currently scheduled or in progress" },
    { label: "Total requests", value: String(jobs.length), helpText: "All-time bookings" },
    {
      label: "Total spent",
      value: `NGN ${totalSpent.toLocaleString()}`,
      helpText: `Across ${completedJobs.length} completed job${completedJobs.length === 1 ? "" : "s"}`,
    },
  ];

  return { jobs, stats };
}

export async function getArtisanDashboardData(artisanUserId: string) {
  await connectToDatabase();

  const profile = await ArtisanProfile.findOne({ userId: artisanUserId }).lean();
  if (!profile) return null;

  const bookings = await Booking.find({ artisanId: profile._id })
    .populate({ path: "customerId", select: "name" })
    .sort({ createdAt: -1 })
    .lean();

  const jobs: DashboardJob[] = bookings.map((booking) => {
    const customer = booking.customerId as unknown as { name?: string } | null;

    // From the artisan's point of view, "awaiting-quote" reads better as
    // "new request" — it's the same underlying status either way.
    const status: JobStatus =
      booking.status === "awaiting-quote" ? "new-request" : (booking.status as JobStatus);

    return {
      id: booking._id.toString(),
      title: booking.title,
      counterpartyName: customer?.name ?? "Customer",
      status,
      dateLabel: booking.scheduledFor
        ? formatDateLabel(new Date(booking.scheduledFor), "Scheduled for")
        : formatDateLabel(new Date(booking.createdAt), "Requested"),
      amountNaira: booking.amountNaira,
    };
  });

  const newRequestsCount = jobs.filter((j) => j.status === "new-request").length;
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const earnings = completedJobs.reduce((sum, j) => sum + j.amountNaira, 0);

  const stats: DashboardStat[] = [
    { label: "New requests", value: String(newRequestsCount), helpText: "Waiting on your quote" },
    {
      label: "Earnings",
      value: `NGN ${earnings.toLocaleString()}`,
      helpText: `${completedJobs.length} job${completedJobs.length === 1 ? "" : "s"} completed`,
    },
    {
      label: "Rating",
      value: profile.rating ? profile.rating.toFixed(1) : "—",
      helpText: `${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"}`,
    },
  ];

  return { jobs, stats, profile };
}
