"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { DemoAuthNote } from "./demo-auth-note";
import { signUpSchema, type SignUpValues } from "@/lib/schemas";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

const RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "A letter", test: (p: string) => /[A-Za-z]/.test(p) },
  { label: "A number", test: (p: string) => /[0-9]/.test(p) },
];

export function SignUpForm() {
  const router = useRouter();
  const { signUp, session, hydrated } = useAppStore();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", terms: false },
  });
  const password = watch("password") ?? "";

  useEffect(() => {
    if (hydrated && session && !done) router.replace("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  async function onSubmit(values: SignUpValues) {
    setFormError(null);
    try {
      setDone(true);
      await signUp(values.name, values.email, values.password);
      toast.success("Demo account created", { description: "Let’s set up your plan." });
      router.replace("/onboarding");
    } catch (e) {
      setDone(false);
      setFormError(e instanceof Error ? e.message : "Sign up failed.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Takes under a minute. Your data stays in this browser.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}{" "}
            {formError.includes("already exists") && (
              <Link href="/sign-in" className="font-semibold underline">
                Sign in instead
              </Link>
            )}
          </p>
        )}
        <Field label="Full name" htmlFor="su-name" error={errors.name?.message}>
          <Input {...describedBy("su-name", errors.name?.message)} autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="su-email" error={errors.email?.message}>
          <Input {...describedBy("su-email", errors.email?.message)} type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="su-password" error={errors.password?.message}>
          <PasswordInput {...describedBy("su-password", errors.password?.message)} autoComplete="new-password" {...register("password")} />
        </Field>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Password requirements">
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <li key={r.label} className={cn("flex items-center gap-1", ok ? "text-accent-text" : "text-subtle")}>
                {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                {r.label}
                <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
              </li>
            );
          })}
        </ul>
        <Field label="Confirm password" htmlFor="su-confirm" error={errors.confirmPassword?.message}>
          <PasswordInput {...describedBy("su-confirm", errors.confirmPassword?.message)} autoComplete="new-password" {...register("confirmPassword")} />
        </Field>
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <Checkbox
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  aria-invalid={errors.terms ? true : undefined}
                  aria-describedby={errors.terms ? "su-terms-error" : undefined}
                />
              )}
            />
            <span className="text-muted">
              I understand this is a demo and accept the{" "}
              <Link href="/terms" className="text-accent-text hover:underline">
                demo terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-accent-text hover:underline">
                privacy notice
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p id="su-terms-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.terms.message}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-accent-text hover:underline">
          Sign in
        </Link>
      </p>
      <DemoAuthNote />
    </div>
  );
}
