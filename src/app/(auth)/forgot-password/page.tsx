"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailQuestion } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotSchema } from "@/lib/schemas";

type Values = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    await new Promise((r) => setTimeout(r, 500));
    setSentTo(values.email);
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase">Reset password</h1>
      {sentTo ? (
        <div role="status" className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <MailQuestion className="size-8 text-warning" aria-hidden />
          <h2 className="mt-3 font-semibold">No email was sent — this is a demo</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Password reset emails need a backend, so nothing was sent to <span className="text-foreground">{sentTo}</span>. Demo accounts live only in this
            browser. You can create a new demo account, or use the one-click demo.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/sign-in?demo=1">Explore Demo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-up">Create new account</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">Enter your email and we’ll show you how resets will work.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
            <Field label="Email" htmlFor="fp-email" error={errors.email?.message}>
              <Input {...describedBy("fp-email", errors.email?.message)} type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              Send reset link
            </Button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-medium text-accent-text hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
