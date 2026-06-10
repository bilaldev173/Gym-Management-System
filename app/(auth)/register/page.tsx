"use client";

import { Dumbbell, Loader2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import {
  AUTH_CARD_CLASSNAME,
  AUTH_INPUT_CLASSNAME,
  type AuthAlert,
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

type RegisterForm = {
  fullName: string;
  gymName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<RegisterForm>({
    fullName: "",
    gymName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AuthAlert | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setAlert(null);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: {
          full_name: form.fullName.trim(),
          gym_name: form.gymName.trim(),
        },
      },
    });

    if (error) {
      setAlert({ type: "error", message: error.message });
      setIsLoading(false);
      return;
    }

    if (data.user && data.session) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.fullName.trim(),
        role: "manager",
      });

      if (profileError) {
        setAlert({
          type: "error",
          message: `Account created, but profile setup failed: ${profileError.message}`,
        });
        setIsLoading(false);
        return;
      }

      setAlert({
        type: "success",
        message: "Account created successfully. Redirecting to your dashboard...",
      });

      window.location.href = "/dashboard";
      return;
    }

    setAlert({
      type: "success",
      message:
        "Registration successful. Please check your email to confirm your account before signing in.",
    });
    setIsLoading(false);
  }

  return (
    <div className={AUTH_CARD_CLASSNAME}>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25">
          <Dumbbell className="size-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Start managing your gym in minutes
        </p>
      </div>

      {alert && (
        <div
          className={cn(
            "mb-6 rounded-xl border px-4 py-3 text-sm",
            alert.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          )}
        >
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-slate-300"
          >
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            value={form.fullName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
            className={AUTH_INPUT_CLASSNAME}
            placeholder="John Manager"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="gymName" className="text-sm font-medium text-slate-300">
            Gym Name
          </label>
          <input
            id="gymName"
            type="text"
            required
            value={form.gymName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, gymName: event.target.value }))
            }
            className={AUTH_INPUT_CLASSNAME}
            placeholder="Sports Salle Downtown"
          />
        </div>

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
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className={AUTH_INPUT_CLASSNAME}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
