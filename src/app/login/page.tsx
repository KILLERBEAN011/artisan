"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Wrench } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-cloud-200 bg-white p-6">
        <Link href="/" className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-navy-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
            <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          NaijaCraft
        </Link>

        <h1 className="font-display text-xl font-bold text-navy-900">Log in</h1>
        <p className="mt-1 text-sm text-ink-500">Welcome back — enter your details below.</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-brand-green-600 hover:text-brand-green-700">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
