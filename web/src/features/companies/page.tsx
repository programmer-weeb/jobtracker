import { type FormEvent, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { Input } from "../../components/ui/input";
import { useCompanies, useCreateCompany, useDeleteCompany, useUpdateCompany } from "./hooks";
import type { Company, UpsertCompanyPayload } from "./model";

interface CompanyFormState {
  name: string;
  website: string;
  location: string;
  notes: string;
}

const emptyForm: CompanyFormState = {
  name: "",
  website: "",
  location: "",
  notes: ""
};

function toPayload(form: CompanyFormState): UpsertCompanyPayload {
  return {
    name: form.name.trim(),
    website: form.website.trim() || null,
    location: form.location.trim() || null,
    notes: form.notes.trim() || null
  };
}

function toForm(company: Company): CompanyFormState {
  return {
    name: company.name,
    website: company.website ?? "",
    location: company.location ?? "",
    notes: company.notes ?? ""
  };
}

function toErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; errors?: string[] } | undefined;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join(", ");
    }
    if (data?.error) {
      return data.error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function CompanyRow(props: {
  company: Company;
  onSave: (id: number, payload: UpsertCompanyPayload) => Promise<void>;
  onDelete: (id: number) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const { company, onSave, onDelete, isUpdating, isDeleting } = props;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CompanyFormState>(() => toForm(company));
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }

    setError(null);

    try {
      await onSave(company.id, toPayload(form));
      setEditing(false);
    } catch (submitError) {
      setError(toErrorMessage(submitError, "Failed to update company."));
    }
  };

  const onRemove = () => {
    onDelete(company.id);
  };

  if (editing) {
    return (
      <tr className="border-t border-[var(--border)] align-top">
        <td colSpan={5} className="p-4">
          <form className="grid gap-2 md:grid-cols-2" onSubmit={onSubmit}>
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Company name"
              aria-label="Company name"
            />
            <Input
              value={form.website}
              onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              placeholder="Website"
              aria-label="Website"
            />
            <Input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Location"
              aria-label="Location"
            />
            <Input
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notes"
              aria-label="Notes"
            />
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button size="sm" type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save"}</Button>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => {
                  setForm(toForm(company));
                  setEditing(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-[var(--border)]">
      <td className="px-5 py-4 font-semibold">{company.name}</td>
      <td className="px-5 py-4 text-[var(--muted-foreground)]">{company.website ?? "-"}</td>
      <td className="px-5 py-4 text-[var(--muted-foreground)]">{company.location ?? "-"}</td>
      <td className="px-5 py-4 text-[var(--muted-foreground)]">{company.notes ?? "-"}</td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={onRemove} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
        </div>
        {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
      </td>
    </tr>
  );
}

export function CompaniesPage() {
  const { data, isLoading, isError, error } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mutationFeedback, setMutationFeedback] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const companies = useMemo(() => data?.data ?? [], [data]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setCreateError("Company name is required.");
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);

    try {
      await createMutation.mutateAsync(toPayload(form));
      setForm(emptyForm);
      setCreateSuccess("Company added.");
    } catch (submitError) {
      setCreateError(toErrorMessage(submitError, "Failed to create company."));
    }
  };

  return (
    <div className="space-y-4">
      <section className="mx-[calc(50%-50vw)] -mt-6 bg-white px-4 py-16 text-center md:-mt-8 md:px-8">
        <h1 className="apple-display mx-auto max-w-4xl text-[40px] leading-[1.1] md:text-[56px]">Companies that anchor the search.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[24px] font-light leading-normal text-[var(--muted-foreground)]">
          Keep employer context close to every application.
        </p>
      </section>

      <Card className="p-4 md:p-6">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Company name" aria-label="Create company name" />
          <Input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="Website" aria-label="Create website" />
          <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" aria-label="Create location" />
          <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" aria-label="Create notes" />
          <div className="md:col-span-2 flex items-center gap-2">
            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Add company"}</Button>
            {createError ? <p className="text-sm text-[var(--danger)]">{createError}</p> : null}
            {createSuccess ? <p className="text-sm text-[var(--brand-700)]">{createSuccess}</p> : null}
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? <p className="p-4 text-sm">Loading companies...</p> : null}
        {isError ? <p className="p-4 text-sm text-[var(--danger)]">Failed to load companies: {(error as Error).message}</p> : null}
        {!isLoading && !isError && companies.length === 0 ? (
          <p className="p-4 text-sm text-[var(--muted-foreground)]">No companies yet. Add your first company above.</p>
        ) : null}

        {!isLoading && !isError && companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[var(--canvas-parchment)]">
                <tr className="text-[var(--muted-foreground)]">
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Website</th>
                  <th className="px-5 py-4 font-semibold">Location</th>
                  <th className="px-5 py-4 font-semibold">Notes</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    onSave={async (id, payload) => {
                      setMutationFeedback(null);
                      setUpdatingId(id);
                      try {
                        await updateMutation.mutateAsync({ id, company: payload });
                        setMutationFeedback("Company updated.");
                      } finally {
                        setUpdatingId(null);
                      }
                    }}
                    onDelete={(id) => {
                      setPendingDeleteId(id);
                      setDeleteDialogOpen(true);
                    }}
                    isUpdating={updatingId === company.id && updateMutation.isPending}
                    isDeleting={deletingId === company.id && deleteMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {mutationFeedback ? <p className="px-4 pb-4 text-sm text-[var(--brand-700)]">{mutationFeedback}</p> : null}
      </Card>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Company"
        description={pendingDeleteId ? `Are you sure you want to delete "${companies.find(c => c.id === pendingDeleteId)?.name}"? This action cannot be undone.` : ""}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        isPending={pendingDeleteId !== null && deleteMutation.isPending}
        onConfirm={async () => {
          if (pendingDeleteId !== null) {
            setMutationFeedback(null);
            setDeletingId(pendingDeleteId);
            try {
              await deleteMutation.mutateAsync(pendingDeleteId);
              setMutationFeedback("Company deleted.");
              setDeleteDialogOpen(false);
              setPendingDeleteId(null);
            } finally {
              setDeletingId(null);
            }
          }
        }}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
