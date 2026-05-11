import { type FormEvent, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { CompanySummary, ApplicationStatus, TagSummary } from "../model";
import { applicationStatuses } from "../model";
import type { CreateApplicationInput } from "../api";
import { TagSelector } from "./tag-selector";

interface CreateApplicationFormProps {
  companies: CompanySummary[];
  tags: TagSummary[];
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateApplicationInput) => Promise<void>;
  onCreateTag?: (name: string) => Promise<TagSummary>;
  onDeleteTag?: (tagId: number) => Promise<void>;
}

interface CreateFormState {
  title: string;
  company_id: string;
  status: ApplicationStatus;
  source: string;
  remote: boolean;
  location: string;
  tag_ids: number[];
}

const emptyForm: CreateFormState = {
  title: "",
  company_id: "",
  status: "wishlist",
  source: "",
  remote: true,
  location: "",
  tag_ids: []
};

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function CreateApplicationForm({
  companies,
  tags,
  isSaving,
  onCancel,
  onSubmit,
  onCreateTag,
  onDeleteTag
}: CreateApplicationFormProps) {
  const [form, setForm] = useState<CreateFormState>(() => ({
    ...emptyForm,
    company_id: companies[0]?.id.toString() ?? ""
  }));
  const [error, setError] = useState<string | null>(null);
  const selectedCompanyId = form.company_id || companies[0]?.id.toString() || "";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const companyId = Number(selectedCompanyId);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!Number.isInteger(companyId) || companyId <= 0) {
      setError("Company is required.");
      return;
    }

    setError(null);
    await onSubmit({
      title: form.title.trim(),
      company_id: companyId,
      status: form.status,
      source: toNullableString(form.source),
      remote: form.remote,
      location: toNullableString(form.location),
      tag_ids: form.tag_ids
    });
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Title
          <Input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Rails Engineer"
            aria-label="Application title"
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Company
          <select
            value={selectedCompanyId}
            onChange={(event) => setForm((current) => ({ ...current, company_id: event.target.value }))}
            className="h-11 w-full rounded-full border border-black/10 bg-white px-5 py-2 text-[17px] tracking-[-0.374px]"
            aria-label="Application company"
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Status
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ApplicationStatus }))}
            className="h-11 w-full rounded-full border border-black/10 bg-white px-5 py-2 text-[17px] tracking-[-0.374px]"
            aria-label="Application status"
          >
            {applicationStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Source
          <Input
            value={form.source}
            onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
            placeholder="LinkedIn"
            aria-label="Application source"
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Location
          <Input
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            placeholder={form.remote ? "Remote" : "Cairo"}
            aria-label="Application location"
          />
        </label>

        <label className="flex items-center gap-2 self-end text-sm font-medium">
          <input
            type="checkbox"
            checked={form.remote}
            onChange={(event) => setForm((current) => ({ ...current, remote: event.target.checked }))}
          />
          Remote
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Tags</p>
        <TagSelector
          tags={tags}
          selectedIds={form.tag_ids}
          onChange={(tagIds) => setForm((current) => ({ ...current, tag_ids: tagIds }))}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
          disabled={isSaving}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSaving || companies.length === 0}>{isSaving ? "Creating..." : "Create application"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        {companies.length === 0 ? <p className="text-sm text-[var(--danger)]">Add a company before creating an application.</p> : null}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      </div>
    </form>
  );
}
