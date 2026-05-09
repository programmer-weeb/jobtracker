import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { ApplicationsFilters } from "../api";
import { applicationStatuses, type CompanySummary, type ApplicationStatus, type TagSummary } from "../model";

export type ApplicationFiltersState = ApplicationsFilters;

interface FiltersBarProps {
  filters: ApplicationFiltersState;
  companies: CompanySummary[];
  tags: TagSummary[];
  onChange: (next: ApplicationFiltersState) => void;
  onReset: () => void;
}

function toSelectValue(value: string | number | undefined) {
  return value === undefined ? "" : String(value);
}

export function ApplicationsFiltersBar(props: FiltersBarProps) {
  const { filters, companies, tags, onChange, onReset } = props;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <Input
        placeholder="Search title, company, source"
        value={filters.q ?? ""}
        onChange={(event) => onChange({ ...filters, q: event.target.value || undefined })}
        aria-label="Search applications"
        className="xl:col-span-2"
      />

      <select
        className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
        value={toSelectValue(filters.status)}
        onChange={(event) => onChange({ ...filters, status: (event.target.value || undefined) as ApplicationStatus | undefined })}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {applicationStatuses.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>

      <select
        className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
        value={toSelectValue(filters.tag)}
        onChange={(event) => {
          const value = event.target.value;
          onChange({ ...filters, tag: value ? Number(value) : undefined });
        }}
        aria-label="Filter by tag"
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>{tag.name}</option>
        ))}
      </select>

      <select
        className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
        value={toSelectValue(filters.company)}
        onChange={(event) => {
          const value = event.target.value;
          onChange({ ...filters, company: value ? Number(value) : undefined });
        }}
        aria-label="Filter by company"
      >
        <option value="">All companies</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>{company.name}</option>
        ))}
      </select>

      <select
        className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
        value={filters.remote === undefined ? "" : filters.remote ? "true" : "false"}
        onChange={(event) => {
          const value = event.target.value;
          onChange({
            ...filters,
            remote: value === "" ? undefined : value === "true"
          });
        }}
        aria-label="Filter by remote"
      >
        <option value="">Remote and onsite</option>
        <option value="true">Remote only</option>
        <option value="false">Onsite only</option>
      </select>

      <Button variant="secondary" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}
