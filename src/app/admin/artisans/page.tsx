import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import "@/models/User";
import { DeleteArtisanButton } from "@/components/admin/DeleteArtisanButton";

export default async function AdminArtisansPage() {
  await connectToDatabase();

  const artisans = await ArtisanProfile.find({})
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Manage Artisans
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        View and moderate all artisan profiles on the platform.
      </p>

      <div className="mt-5 space-y-3">
        {artisans.length === 0 ? (
          <p className="rounded-2xl border border-cloud-200 bg-white p-6 text-center text-sm text-ink-500">
            No artisans found.
          </p>
        ) : (
          artisans.map((artisan) => {
            const user = artisan.userId as unknown as {
              name?: string;
              email?: string;
            } | null;
            const artisanName = user?.name ?? "Unknown Artisan";

            return (
              <div
                key={artisan._id.toString()}
                className="flex flex-col gap-3 rounded-2xl border border-cloud-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/search/${artisan._id}`}
                      className="font-semibold text-navy-900 hover:text-brand-green-600"
                      target="_blank"
                    >
                      {artisanName}
                    </Link>
                    <span className="rounded-full bg-cloud-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
                      {artisan.sellerType}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {artisan.serviceTitle} · {artisan.location?.city},{" "}
                    {artisan.location?.state}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {user?.email ?? "No email"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center">
                  <DeleteArtisanButton
                    artisanId={artisan._id.toString()}
                    artisanName={artisanName}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
