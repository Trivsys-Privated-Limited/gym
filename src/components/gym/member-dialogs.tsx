"use client";

import { useEffect, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { Pencil, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SimulatedBadge } from "@/components/ui/simulated";
import { memberStatus } from "@/lib/calculations";
import { MEMBER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/dates";
import { addMember, deleteMember, renewMembership, updateMember } from "@/lib/gym-actions";
import { useGymData } from "@/lib/store/app-store";
import type { Member, PaymentMethod } from "@/lib/types";
import { formatCurrency, initials } from "@/lib/utils";

const METHODS: Record<PaymentMethod, string> = { card: "Card", cash: "Cash", "bank-transfer": "Bank transfer" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MemberFormDialog({ open, onOpenChange, member }: { open: boolean; onOpenChange: (o: boolean) => void; member?: Member | null }) {
  const { gym, update } = useGymData();
  const [form, setForm] = useState({ name: "", email: "", phone: "", planId: "", joinDate: todayISO(), trainerId: "", notes: "" });
  const [takePayment, setTakePayment] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm({
      name: member?.name ?? "",
      email: member?.email ?? "",
      phone: member?.phone ?? "",
      planId: member?.planId ?? gym.plans[0]?.id ?? "",
      joinDate: member?.joinDate ?? todayISO(),
      trainerId: member?.trainerId ?? "",
      notes: member?.notes ?? "",
    });
    setTakePayment(true);
    setErrors({});
  }, [open, member, gym.plans]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter the member’s name.";
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Enter a valid email.";
    else if (gym.members.some((m) => m.id !== member?.id && m.email.toLowerCase() === form.email.trim().toLowerCase())) errs.email = "A member with this email already exists.";
    if (form.phone && !/^[+\d][\d\s-]{5,}$/.test(form.phone.trim())) errs.phone = "Enter a valid phone number.";
    if (!form.planId) errs.planId = "Choose a plan.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const plan = gym.plans.find((p) => p.id === form.planId)!;
    const base = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      planId: form.planId,
      joinDate: form.joinDate,
      trainerId: form.trainerId || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (member) {
      update((g) => updateMember(g, member.id, base));
      toast.success("Member updated");
    } else {
      const expiryDate = format(addMonths(parseISO(form.joinDate), plan.durationMonths), "yyyy-MM-dd");
      update((g) => addMember(g, { ...base, expiryDate, frozen: false }, takePayment ? { method } : undefined));
      toast.success("Member added", { description: takePayment ? "Demo payment recorded (simulated)." : undefined });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={member ? "Edit member" : "Add member"} description="Use fictional details — this is demo data.">
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="mf-name" error={errors.name}>
              <Input id="mf-name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name || undefined} />
            </Field>
            <Field label="Email" htmlFor="mf-email" error={errors.email}>
              <Input id="mf-email" type="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email || undefined} />
            </Field>
            <Field label="Phone" htmlFor="mf-phone" optional error={errors.phone}>
              <Input id="mf-phone" type="tel" value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="Plan" htmlFor="mf-plan" error={errors.planId}>
              <Select id="mf-plan" value={form.planId} onChange={set("planId")}>
                {gym.plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.priceMonthly)}/mo
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Start date" htmlFor="mf-join">
              <Input id="mf-join" type="date" value={form.joinDate} onChange={set("joinDate")} disabled={!!member} />
            </Field>
            <Field label="Trainer" htmlFor="mf-trainer" optional>
              <Select id="mf-trainer" value={form.trainerId} onChange={set("trainerId")}>
                <option value="">None</option>
                {gym.trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notes" htmlFor="mf-notes" optional>
            <Textarea id="mf-notes" rows={2} value={form.notes} onChange={set("notes")} maxLength={200} />
          </Field>
          {!member && (
            <div className="rounded-xl border border-border p-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={takePayment} onCheckedChange={(v) => setTakePayment(v === true)} />
                Record first payment <SimulatedBadge />
              </label>
              {takePayment && (
                <Select aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} wrapperClassName="mt-3">
                  {(Object.keys(METHODS) as PaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {METHODS[m]}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{member ? "Save changes" : "Add member"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MemberProfileDialog({
  member,
  onOpenChange,
  onEdit,
}: {
  member: Member | null;
  onOpenChange: (o: boolean) => void;
  onEdit: (m: Member) => void;
}) {
  const { gym, update, role } = useGymData();
  const confirm = useConfirm();
  const [renewPlan, setRenewPlan] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  // Always read the latest version of the member from the store.
  const m = member ? gym.members.find((x) => x.id === member.id) ?? null : null;

  useEffect(() => {
    if (m) setRenewPlan(m.planId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  if (!m) return <Dialog open={false} onOpenChange={onOpenChange} />;
  const status = memberStatus(m);
  const plan = gym.plans.find((p) => p.id === m.planId);
  const trainer = gym.trainers.find((t) => t.id === m.trainerId);
  const payments = gym.payments.filter((p) => p.memberId === m.id).sort((a, b) => b.date.localeCompare(a.date));
  const visits = gym.attendance.filter((a) => a.memberId === m.id);
  const last = visits.sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0];
  const isAdmin = role === "admin";
  const isSelf = m.id === gym.selfMemberId;

  return (
    <Dialog open={!!m} onOpenChange={onOpenChange}>
      <DialogContent title={m.name} description={m.email} size="lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-3 font-bold">{initials(m.name)}</span>
          <Badge tone={MEMBER_STATUS[status].tone}>{MEMBER_STATUS[status].label}</Badge>
          {isSelf && <Badge tone="primary">You (demo)</Badge>}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {[
            ["Plan", plan?.name ?? "—"],
            ["Expires", formatDate(m.expiryDate, "MMM d, yyyy")],
            ["Joined", formatDate(m.joinDate, "MMM d, yyyy")],
            ["Phone", m.phone || "—"],
            ["Trainer", trainer?.name ?? "None"],
            ["Visits (30 days)", String(visits.length)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {last && <p className="mt-3 text-xs text-muted">Last visit: {format(new Date(last.checkIn), "EEE, MMM d · HH:mm")}</p>}
        {m.notes && <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">{m.notes}</p>}

        {isAdmin && (
          <section className="mt-6 rounded-2xl border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              Renew membership <SimulatedBadge />
            </h3>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Select aria-label="Renewal plan" value={renewPlan} onChange={(e) => setRenewPlan(e.target.value)} wrapperClassName="flex-1 min-w-0">
                {gym.plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatCurrency(p.priceMonthly * p.durationMonths)}
                  </option>
                ))}
              </Select>
              <Select aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} wrapperClassName="sm:w-40">
                {(Object.keys(METHODS) as PaymentMethod[]).map((x) => (
                  <option key={x} value={x}>
                    {METHODS[x]}
                  </option>
                ))}
              </Select>
              <Button
                onClick={() => {
                  update((g) => renewMembership(g, m.id, renewPlan, method));
                  toast.success("Membership renewed", { description: "Demo payment recorded — no real charge was made." });
                }}
              >
                <RefreshCw /> Renew
              </Button>
            </div>
          </section>
        )}

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Payment history</h3>
          {payments.length ? (
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {payments.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block">{formatDate(p.date, "MMM d, yyyy")}</span>
                    <span className="text-xs text-muted">
                      {METHODS[p.method]} · {p.reference}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                    <Badge tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No payments recorded.</p>
          )}
        </section>

        {isAdmin && (
          <DialogFooter className="sm:justify-between">
            <Button
              variant="danger-ghost"
              disabled={isSelf}
              title={isSelf ? "Your own demo record can’t be deleted" : undefined}
              onClick={() =>
                confirm.ask({
                  title: `Delete ${m.name}?`,
                  description: "The member and their class bookings will be removed. Payment and attendance history are kept for records.",
                  confirmLabel: "Delete member",
                  destructive: true,
                  onConfirm: () => {
                    update((g) => deleteMember(g, m.id));
                    onOpenChange(false);
                    toast.success("Member deleted");
                  },
                })
              }
            >
              <Trash2 /> Delete
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  update((g) => updateMember(g, m.id, { frozen: !m.frozen }));
                  toast.success(m.frozen ? "Membership unfrozen" : "Membership frozen");
                }}
              >
                {m.frozen ? <Play /> : <Pause />} {m.frozen ? "Unfreeze" : "Freeze"}
              </Button>
              <Button variant="secondary" onClick={() => onEdit(m)}>
                <Pencil /> Edit
              </Button>
            </div>
          </DialogFooter>
        )}
        {confirm.element}
      </DialogContent>
    </Dialog>
  );
}
