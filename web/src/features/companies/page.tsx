import { type FormEvent, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
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

function CompanyRow(props: {
  company: Company;
  onSave: (id: number, payload: UpsertCompanyPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
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
      setError((submitError as Error).message || "Failed to update company.");
    }
  };

  const onRemove = async () => {
    const confirmed = window.confirm(`Delete ${company.name}?`);
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await onDelete(company.id);
    } catch (deleteError) {
      setError((deleteError as Error).message || "Failed to delete company.");
    }
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
      <td className="px-3 py-3 font-medium">{company.name}</td>
      <td className="px-3 py-3 text-[var(--muted-foreground)]">{company.website ?? "-"}</td>
      <td className="px-3 py-3 text-[var(--muted-foreground)]">{company.location ?? "-"}</td>
      <td className="px-3 py-3 text-[var(--muted-foreground)]">{company.notes ?? "-"}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={onRemove} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
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

  const companies = useMemo(() => data?.data ?? [], [data]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setCreateError("Company name is required.");
      return;
    }

    setCreateError(null);

    try {
      await createMutation.mutateAsync(toPayload(form));
      setForm(emptyForm);
    } catch (submitError) {
      setCreateError((submitError as Error).message || "Failed to create company.");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-xl font-semibold">Companies</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Create and manage companies tied to your applications.</p>
      </Card>

      <Card className="p-4">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Company name" aria-label="Create company name" />
          <Input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="Website" aria-label="Create website" />
          <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" aria-label="Create location" />
          <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" aria-label="Create notes" />
          <div className="md:col-span-2 flex items-center gap-2">
            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Add company"}</Button>
            {createError ? <p className="text-sm text-[var(--danger)]">{createError}</p> : null}
          </div>
        </form>
      </Card>

      <Card className="p-0">
        {isLoading ? <p className="p-4 text-sm">Loading companies...</p> : null}
        {isError ? <p className="p-4 text-sm text-[var(--danger)]">Failed to load companies: {(error as Error).message}</p> : null}
        {!isLoading && !isError && companies.length === 0 ? (
          <p className="p-4 text-sm text-[var(--muted-foreground)]">No companies yet. Add your first company above.</p>
        ) : null}

        {!isLoading && !isError && companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Website</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    onSave={async (id, payload) => {
                      await updateMutation.mutateAsync({ id, company: payload });
                    }}
                    onDelete={async (id) => {
                      await deleteMutation.mutateAsync(id);
                    }}
                    isUpdating={updateMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
