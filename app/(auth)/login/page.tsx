"use client";

import { Dumbbell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

import {
  AUTH_CARD_CLASSNAME,
  AUTH_INPUT_CLASSNAME,
  type AuthAlert,
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    rememberMe: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [alert, setAlert] = useState<AuthAlert | null>(null);

  const callbackError = searchParams.get("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setAlert(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      setAlert({
        type: "error",
        message: error.message,
      });
      setIsLoading(false);
      return;
    }

    if (form.rememberMe) {
      window.localStorage.setItem("sports-salle-remember-me", "true");
    } else {
      window.localStorage.removeItem("sports-salle-remember-me");
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!form.email.trim()) {
      setAlert({
        type: "error",
        message: "Enter your email address first, then click Forgot Password.",
      });
      return;
    }

    setIsResetting(true);
    setAlert(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
      form.email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      }
    );

    if (error) {
      setAlert({ type: "error", message: error.message });
    } else {
      setAlert({
        type: "success",
        message: "Password reset link sent. Check your email inbox.",
      });
    }

    setIsResetting(false);
  }

  return (
    <div className={AUTH_CARD_CLASSNAME}>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25">
          <Dumbbell className="size-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Welcome Back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to manage your Sports Salle
        </p>
      </div>

      {(alert || callbackError) && (
        <div
          className={cn(
            "mb-6 rounded-xl border px-4 py-3 text-sm",
            alert?.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          )}
        >
          {alert?.message ?? callbackError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className={AUTH_INPUT_CLASSNAME}
            placeholder="manager@gym.com"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className={AUTH_INPUT_CLASSNAME}
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  rememberMe: event.target.checked,
                }))
              }
              className="size-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30"
            />
            Remember me
          </label>

          <button
            type="button"
            onClick={() => void handleForgotPassword()}
            disabled={isResetting}
            className="text-sm text-slate-400 transition-colors hover:text-emerald-400 disabled:opacity-50"
          >
            {isResetting ? "Sending..." : "Forgot Password?"}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className={`${AUTH_CARD_CLASSNAME} flex items-center justify-center py-16`}>
      <Loader2 className="size-6 animate-spin text-emerald-400" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
