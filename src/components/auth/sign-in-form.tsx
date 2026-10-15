"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { DemoAuthNote } from "./demo-auth-note";
import { signInSchema, type SignInValues } from "@/lib/schemas";
import { useAppStore } from "@/lib/store/app-store";
import { DEMO_ACCOUNT } from "@/lib/brand";

/** Only allow in-app redirects. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, exploreDemo, session, hydrated } = useAppStore();
  const [formError, setFormError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const autoDemo = useRef(false);
  const next = safeNext(params.get("next"));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "", remember: true } });

  async function startDemo() {
    setDemoLoading(true);
    try {
      await exploreDemo();
      toast.success("Welcome to the demo account", { description: "Sample data is loaded — feel free to change anything." });
      router.replace("/dashboard");
    } catch {
      setDemoLoading(false);
      setFormError("Couldn’t start the demo. Is browser storage enabled?");
    }
  }

  // Already signed in → skip the form. "?demo=1" starts the demo directly.
  useEffect(() => {
    if (!hydrated) return;
    if (params.get("demo") === "1" && !autoDemo.current) {
      autoDemo.current = true;
      if (session) router.replace("/dashboard");
      else void startDemo();
      return;
    }
    if (session && !isSubmitting && !demoLoading) router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  async function onSubmit(values: SignInValues) {
    setFormError(null);
    try {
      await signIn(values.email, values.password, values.remember);
      toast.success("Signed in", { description: "Welcome back!" });
      router.replace(next);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Sign in failed.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to your demo account to continue.</p>

      <Button variant="secondary" size="lg" className="mt-8 w-full" onClick={startDemo} loading={demoLoading}>
        {!demoLoading && <Sparkles />} Explore Demo — one click, sample data
      </Button>

      <div className="my-6 flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-border" />
        or sign in with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <Field label="Email" htmlFor="signin-email" error={errors.email?.message}>
          <Input {...describedBy("signin-email", errors.email?.message)} type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="signin-password" error={errors.password?.message}>
          <PasswordInput {...describedBy("signin-password", errors.password?.message)} autoComplete="current-password" {...register("password")} />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Controller
              control={control}
              name="remember"
              render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} aria-label="Remember me" />}
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm text-accent-text hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-subtle">
        Demo credentials:{" "}
        <button
          type="button"
          className="font-medium text-muted underline underline-offset-2 hover:text-foreground"
          onClick={() => {
            setValue("email", DEMO_ACCOUNT.email);
            setValue("password", DEMO_ACCOUNT.password);
          }}
        >
          {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
        </button>{" "}
        (available after the demo has been opened once in this browser)
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/sign-up" className="font-medium text-accent-text hover:underline">
          Create a demo account
        </Link>
      </p>
      <DemoAuthNote />
    </div>
  );
}
