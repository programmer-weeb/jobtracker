import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { MultiSelect } from "../../../components/ui/multi-select";
import type { ApplicationsFilters } from "../api";
import { applicationStatuses, type CompanySummary, type ApplicationStatus, type TagSummary } from "../model";

export type ApplicationFiltersState = ApplicationsFilters;

interface FiltersBarProps {
  filters: ApplicationFiltersState;
  companies: CompanySummary[];
  tags: TagSummary[];
  onChange: (next: ApplicationFiltersState) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

function SearchField({
  value,
  onSearchChange
}: {
  value: string;
  onSearchChange: (value: string) => void;
}) {
  const [searchValue, setSearchValue] = useState(value);

  return (
    <Input
      placeholder="Search title, company, source"
      value={searchValue}
      onChange={(event) => {
        setSearchValue(event.target.value);
        onSearchChange(event.target.value);
      }}
      aria-label="Search applications"
      className="xl:col-span-2"
    />
  );
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function ApplicationsFiltersBar(props: FiltersBarProps) {
  const { filters, companies, tags, onChange, onSearchChange, onReset } = props;

  const statusOptions = applicationStatuses.map((s) => ({ label: s, value: s }));
  const tagOptions = tags.map((t) => ({ label: t.name, value: t.id }));
  const companyOptions = companies.map((c) => ({ label: c.name, value: c.id }));

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <SearchField key={filters.q ?? ""} value={filters.q ?? ""} onSearchChange={onSearchChange} />

      <MultiSelect
        placeholder="All statuses"
        options={statusOptions}
        selected={toArray(filters.status)}
        onChange={(values) => onChange({ ...filters, status: values as ApplicationStatus[] })}
      />

      <MultiSelect
        placeholder="All tags"
        options={tagOptions}
        selected={toArray(filters.tag)}
        onChange={(values) => onChange({ ...filters, tag: values as number[] })}
      />

      <MultiSelect
        placeholder="All companies"
        options={companyOptions}
        selected={toArray(filters.company)}
        onChange={(values) => onChange({ ...filters, company: values as number[] })}
      />

      <select
        className="h-11 rounded-full border border-black/10 bg-white px-4 text-sm tracking-[-0.224px]"
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

      <Button variant="secondary" size="sm" onClick={onReset} className="h-11 px-6 md:w-auto">
        Reset filters
      </Button>
    </div>
  );
}
