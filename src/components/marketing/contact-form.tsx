"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, describedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { contactSchema, type ContactValues } from "@/lib/schemas";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { ContactMessage } from "@/lib/types";
import { uid } from "@/lib/utils";

const isMessages = (v: unknown): v is ContactMessage[] => Array.isArray(v);

export function ContactForm() {
  const [submitted, setSubmitted] = useState<ContactValues | null>(null);
  const [saveError, setSaveError] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", subject: "", message: "" } });

  const messageLength = watch("message")?.length ?? 0;

  async function onSubmit(values: ContactValues) {
    setSaveError(false);
    // Simulate a short network round-trip so the loading state is visible.
    await new Promise((r) => setTimeout(r, 600));
    const existing = readJSON(KEYS.contact, isMessages) ?? [];
    const ok = writeJSON(KEYS.contact, [{ ...values, id: uid("msg"), createdAt: new Date().toISOString() }, ...existing].slice(0, 50));
    if (!ok) {
      setSaveError(true);
      return;
    }
    setSubmitted(values);
    reset();
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <CheckCircle2 className="size-10 text-accent-text" aria-hidden />
        <div>
          <h2 className="text-xl font-semibold">Thanks, {submitted.name.split(" ")[0]} — demo message saved</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This is a frontend-only demo, so your message was <strong className="text-foreground">not sent</strong> to anyone. It was saved only in this browser’s
            local storage so you can see how the flow would work.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSubmitted(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name" error={errors.name?.message}>
          <Input {...describedBy("contact-name", errors.name?.message)} autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={errors.email?.message}>
          <Input {...describedBy("contact-email", errors.email?.message)} type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Subject" htmlFor="contact-subject" error={errors.subject?.message} className="sm:col-span-2">
          <Input {...describedBy("contact-subject", errors.subject?.message)} {...register("subject")} />
        </Field>
        <Field
          label="Message"
          htmlFor="contact-message"
          error={errors.message?.message}
          hint={`${messageLength}/2000 characters`}
          className="sm:col-span-2"
        >
          <Textarea {...describedBy("contact-message", errors.message?.message, true)} rows={6} {...register("message")} />
        </Field>
      </div>
      {saveError && (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          We couldn’t save your demo message — browser storage may be full or disabled. Please try again.
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">Demo only: messages are stored locally and never sent.</p>
        <Button type="submit" size="lg" loading={isSubmitting}>
          {!isSubmitting && <Send />} Send message
        </Button>
      </div>
    </form>
  );
}
