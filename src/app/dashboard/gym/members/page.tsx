"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, Plus, Search, Users } from "lucide-react";
import { MemberFormDialog, MemberProfileDialog } from "@/components/gym/member-dialogs";
import { RoleGate } from "@/components/gym/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { memberStatus } from "@/lib/calculations";
import { MEMBER_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { useGymData } from "@/lib/store/app-store";
import type { Member, MemberStatus } from "@/lib/types";
import { initials } from "@/lib/utils";

type SortKey = "name" | "expiry" | "joined";

function MembersInner() {
  const { gym, role } = useGymData();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MemberStatus>("all");
  const [plan, setPlan] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [viewing, setViewing] = useState<Member | null>(null);
  const [form, setForm] = useState<{ open: boolean; member?: Member | null }>({ open: false });

  useEffect(() => {
    const s = params.get("status");
    if (s && s in MEMBER_STATUS) setStatus(s as MemberStatus);
  }, [params]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gym.members
      .map((m) => ({ m, status: memberStatus(m) }))
      .filter(({ m, status: s }) => (!q || m.name.toLowerCase().includes(q) || m.email.includes(q) || m.phone.includes(q)) && (status === "all" || s === status) && (plan === "all" || m.planId === plan))
      .sort((a, b) =>
        sort === "name" ? a.m.name.localeCompare(b.m.name) : sort === "expiry" ? a.m.expiryDate.localeCompare(b.m.expiryDate) : b.m.joinDate.localeCompare(a.m.joinDate),
      );
  }, [gym.members, query, status, plan, sort]);

  const planName = (id: string) => gym.plans.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-3xl">
          <div className="relative col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input aria-label="Search members" placeholder="Search name, email or phone" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All statuses</option>
            {(Object.keys(MEMBER_STATUS) as MemberStatus[]).map((s) => (
              <option key={s} value={s}>
                {MEMBER_STATUS[s].label}
              </option>
            ))}
          </Select>
          <Select aria-label="Filter by plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="all">All plans</option>
            {gym.plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Select aria-label="Sort members" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="pl-9">
              <option value="name">Name A–Z</option>
              <option value="expiry">Expiry (soonest)</option>
              <option value="joined">Newest members</option>
            </Select>
          </div>
          {role === "admin" && (
            <Button onClick={() => setForm({ open: true, member: null })}>
              <Plus /> Add member
            </Button>
          )}
        </div>
      </div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {rows.length} of {gym.members.length} members {role === "trainer" && "· read-only in Trainer view"}
      </p>

      {rows.length ? (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Gym members</caption>
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Member</th>
                  <th scope="col" className="px-4 py-3 font-medium">Plan</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Expiry</th>
                  <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ m, status: s }) => (
                  <tr key={m.id} className="border-t border-border transition-colors hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-bold">{initials(m.name)}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {m.name} {m.id === gym.selfMemberId && <Badge tone="primary">You</Badge>}
                          </p>
                          <p className="truncate text-xs text-muted">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{planName(m.planId)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={MEMBER_STATUS[s].tone}>{MEMBER_STATUS[s].label}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatDate(m.expiryDate, "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{formatDate(m.joinDate, "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewing(m)} aria-label={`View ${m.name}`}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {rows.map(({ m, status: s }) => (
              <li key={m.id}>
                <button type="button" onClick={() => setViewing(m)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-bold">{initials(m.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted">
                      {planName(m.planId)} · expires {formatDate(m.expiryDate, "MMM d")}
                    </p>
                  </div>
                  <Badge tone={MEMBER_STATUS[s].tone}>{MEMBER_STATUS[s].label}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="No members match"
          description="Try a different search or filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setPlan("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      <MemberProfileDialog
        member={viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        onEdit={(m) => {
          setViewing(null);
          setForm({ open: true, member: m });
        }}
      />
      <MemberFormDialog open={form.open} onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))} member={form.member} />
    </div>
  );
}

export default function MembersPage() {
  return (
    <RoleGate allow={["admin", "trainer"]}>
      <Suspense>
        <MembersInner />
      </Suspense>
    </RoleGate>
  );
}
