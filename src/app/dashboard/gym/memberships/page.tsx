"use client";

import { useMemo, useState } from "react";
import { Check, CreditCard, Search } from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/gym/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { SimulatedBadge } from "@/components/ui/simulated";
import { memberStatus } from "@/lib/calculations";
import { PAYMENT_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { renewMembership, setPaymentStatus } from "@/lib/gym-actions";
import { useGymData } from "@/lib/store/app-store";
import type { PaymentStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const METHOD_LABEL = { card: "Card", cash: "Cash", "bank-transfer": "Bank transfer" } as const;

function MembershipsInner() {
  const { gym, update, role } = useGymData();
  const confirm = useConfirm();
  const isAdmin = role === "admin";
  const me = gym.members.find((m) => m.id === gym.selfMemberId);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [order, setOrder] = useState<"newest" | "oldest" | "amount">("newest");

  const memberName = (id: string) => gym.members.find((m) => m.id === id)?.name ?? "Former member";
  const planCounts = useMemo(
    () => Object.fromEntries(gym.plans.map((p) => [p.id, gym.members.filter((m) => m.planId === p.id && ["active", "expiring"].includes(memberStatus(m))).length])),
    [gym],
  );

  const payments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gym.payments
      .filter((p) => isAdmin || p.memberId === gym.selfMemberId)
      .filter((p) => (status === "all" || p.status === status) && (!q || memberName(p.memberId).toLowerCase().includes(q) || p.reference.toLowerCase().includes(q)))
      .sort((a, b) => (order === "amount" ? b.amount - a.amount : order === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gym, query, status, order, isAdmin]);

  const totals = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
    const outstanding = payments.filter((p) => p.status !== "paid").reduce((a, p) => a + p.amount, 0);
    return { paid, outstanding };
  }, [payments]);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Membership plans</h2>
          <span className="text-xs text-muted">Placeholder pricing</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {gym.plans.map((p) => {
            const mine = me?.planId === p.id;
            return (
              <li key={p.id} className={cn("flex flex-col rounded-2xl border bg-surface p-5", p.highlighted ? "border-primary/60" : "border-border")}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  {mine && role === "member" ? <Badge tone="primary">Your plan</Badge> : p.highlighted ? <Badge tone="primary">Popular</Badge> : null}
                </div>
                <p className="mt-3 font-display text-4xl font-bold tabular-nums">
                  {formatCurrency(p.priceMonthly)}
                  <span className="text-base font-semibold text-muted">/mo</span>
                </p>
                <p className="text-xs text-muted">{p.durationMonths === 12 ? `Billed ${formatCurrency(p.priceMonthly * 12)} yearly` : "Billed monthly"}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                {isAdmin && <p className="mt-4 text-xs text-muted">{planCounts[p.id]} active members</p>}
                {role === "member" && me && (
                  <Button
                    className="mt-4"
                    variant={mine ? "secondary" : "outline"}
                    onClick={() =>
                      confirm.ask({
                        title: mine ? `Renew ${p.name}?` : `Switch to ${p.name}?`,
                        description: `A demo payment of ${formatCurrency(p.priceMonthly * p.durationMonths)} will be recorded. This is simulated — no real payment is taken.`,
                        confirmLabel: mine ? "Renew (simulated)" : "Switch (simulated)",
                        onConfirm: () => {
                          update((g) => renewMembership(g, me.id, p.id, "card"));
                          toast.success(mine ? "Membership renewed" : `Switched to ${p.name}`, { description: "Simulated payment recorded." });
                        },
                      })
                    }
                  >
                    {mine ? "Renew" : "Switch plan"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <Card>
          <CardHeader className="flex-col sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {isAdmin ? "Payment records" : "My payments"} <SimulatedBadge label="Demo payments" />
              </CardTitle>
              <p className="mt-1 text-sm text-muted">
                Paid {formatCurrency(totals.paid)} · Outstanding {formatCurrency(totals.outstanding)}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {isAdmin && (
                <div className="relative col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                  <Input aria-label="Search payments" placeholder="Member or reference" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
                </div>
              )}
              <Select aria-label="Payment status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">All statuses</option>
                {(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATUS[s].label}
                  </option>
                ))}
              </Select>
              <Select aria-label="Sort payments" value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount">Largest amount</option>
              </Select>
            </div>
            {payments.length ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">Payment records</caption>
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Date</th>
                      {isAdmin && <th scope="col" className="px-3 py-2 font-medium">Member</th>}
                      <th scope="col" className="px-3 py-2 font-medium">Plan</th>
                      <th scope="col" className="px-3 py-2 font-medium">Method</th>
                      <th scope="col" className="px-3 py-2 font-medium">Reference</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
                      <th scope="col" className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 60).map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2 tabular-nums">{formatDate(p.date, "MMM d, yyyy")}</td>
                        {isAdmin && <td className="px-3 py-2">{memberName(p.memberId)}</td>}
                        <td className="px-3 py-2">{gym.plans.find((x) => x.id === p.planId)?.name}</td>
                        <td className="px-3 py-2">{METHOD_LABEL[p.method]}</td>
                        <td className="px-3 py-2 font-mono text-xs text-muted">{p.reference}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(p.amount)}</td>
                        <td className="px-3 py-2">
                          {isAdmin && p.status !== "paid" ? (
                            <Select
                              aria-label={`Status for ${p.reference}`}
                              value={p.status}
                              onChange={(e) => {
                                update((g) => setPaymentStatus(g, p.id, e.target.value as PaymentStatus));
                                toast.success("Payment status updated (demo)");
                              }}
                              className="h-8 text-xs"
                            >
                              {(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((s) => (
                                <option key={s} value={s}>
                                  {PAYMENT_STATUS[s].label}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <Badge tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState compact icon={CreditCard} title="No payments match" />
            )}
            {payments.length > 60 && <p className="mt-2 text-xs text-muted">Showing the first 60 of {payments.length} records.</p>}
          </CardContent>
        </Card>
      </section>
      {confirm.element}
    </div>
  );
}

export default function MembershipsPage() {
  return (
    <RoleGate allow={["admin", "member"]}>
      <MembershipsInner />
    </RoleGate>
  );
}
