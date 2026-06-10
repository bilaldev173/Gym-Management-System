"use client";

import { Loader2, Plus, Search, UserPlus, X } from "lucide-react";
import { FormEvent, useCallback, useMemo, useState } from "react";

import { TableSkeleton } from "@/components/loading/table-skeleton";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { usePaginatedSupabase } from "@/utils/usePaginatedSupabase";

type MemberStatus = "active" | "inactive";

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: MemberStatus;
  created_at: string;
};

type MemberForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: MemberStatus;
};

const emptyForm: MemberForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  status: "inactive",
};

function formatJoinDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const isActive = status === "active";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        isActive
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      )}
    >
      {status}
    </span>
  );
}

export default function MembersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);

  const fetchMembersPage = useCallback(
    (from: number, to: number) =>
      supabase
        .from("members")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to),
    [supabase]
  );

  const {
    data: pageMembers,
    isLoading: isDataLoading,
    error: fetchError,
    nextPage,
    prevPage,
    refetch,
    page,
    pageSize,
    total,
  } = usePaginatedSupabase<Member>(fetchMembersPage, { pageSize: 20 });

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pageMembers;

    return pageMembers.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const phone = (member.phone ?? "").toLowerCase();

      return (
        member.first_name.toLowerCase().includes(query) ||
        member.last_name.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        phone.includes(query)
      );
    });
  }, [pageMembers, searchQuery]);

  const totalMembers = total ?? pageMembers.length;
  const pageStart = totalMembers === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd =
    total === null
      ? pageStart + pageMembers.length - 1
      : Math.min(page * pageSize, total);
  const canGoPrevious = page > 1;
  const canGoNext = total === null || page * pageSize < total;

  function openModal() {
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("members").insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
    });

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
    setForm(emptyForm);
    await refetch();
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-lg">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              Members
            </h1>
            <p className="text-slate-400">
              Manage gym members, contact details, and membership status.
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600"
          >
            <Plus className="size-4" />
            Add New Member
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or phone..."
            className="w-full rounded-xl border border-slate-700/60 bg-slate-950/50 py-3 pr-4 pl-11 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {(error || fetchError) && !isModalOpen && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error ?? fetchError}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-800/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40">
                  <th className="px-5 py-4 font-semibold text-slate-300">Name</th>
                  <th className="px-5 py-4 font-semibold text-slate-300">Email</th>
                  <th className="px-5 py-4 font-semibold text-slate-300">Phone</th>
                  <th className="px-5 py-4 font-semibold text-slate-300">Status</th>
                  <th className="px-5 py-4 font-semibold text-slate-300">
                    Join Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {isDataLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8">
                      <TableSkeleton columns={5} rows={5} />
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <UserPlus className="size-8 text-slate-600" />
                        <p className="font-medium text-slate-300">
                          {searchQuery ? "No members match your search." : "No members yet."}
                        </p>
                        <p className="text-sm">
                          {searchQuery
                            ? "Try a different name or phone number."
                            : "Add your first member to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-800/40 transition-colors last:border-b-0 hover:bg-slate-800/20"
                    >
                      <td className="px-5 py-4 font-medium text-slate-100">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {member.email ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {member.phone ?? "-"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {formatJoinDate(member.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isDataLoading && pageMembers.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {filteredMembers.length} filtered member
              {filteredMembers.length === 1 ? "" : "s"} on page {page}
              {total !== null && ` (${pageStart}-${pageEnd} of ${totalMembers})`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prevPage}
                disabled={!canGoPrevious}
                className="rounded-lg border border-slate-700 px-3 py-1.5 font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={nextPage}
                disabled={!canGoNext}
                className="rounded-lg border border-slate-700 px-3 py-1.5 font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800/50 bg-slate-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2
                  id="add-member-title"
                  className="text-xl font-bold text-slate-100"
                >
                  Add New Member
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter member details below.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="first_name"
                    className="text-sm font-medium text-slate-300"
                  >
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        first_name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="last_name"
                    className="text-sm font-medium text-slate-300"
                  >
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        last_name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-300">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-slate-300">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as MemberStatus,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
