"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Wrench, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "artisan">("customer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const signupRes = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!signupRes.ok) {
      const data = await signupRes.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong creating your account.");
      setLoading(false);
      return;
    }

    // Signup succeeded — log them in immediately so they land in their dashboard.
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError(
        "Account created, but automatic login failed. Please log in manually.",
      );
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-cloud-200 bg-white p-6">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-navy-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
            <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          NaijaCraft
        </Link>

        <h1 className="font-display text-xl font-bold text-navy-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Join NaijaCraft as a customer or artisan.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">Full name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

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

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-navy-900"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-cloud-200 px-3 py-2 pr-10 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <span className="text-xs text-ink-500">At least 8 characters.</span>
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-navy-900">
              I am a...
            </legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  name="role"
                  checked={role === "customer"}
                  onChange={() => setRole("customer")}
                />
                Customer
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  name="role"
                  checked={role === "artisan"}
                  onChange={() => setRole("artisan")}
                />
                Artisan
              </label>
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-green-600 hover:text-brand-green-700"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
