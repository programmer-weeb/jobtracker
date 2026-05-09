import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Card } from "../../components/ui/card";
import { useCompanies } from "../companies/hooks";
import { applicationsRoute } from "../../routes/applications";
import { ApplicationsFiltersBar, type ApplicationFiltersState } from "./components/filters-bar";
import { useApplications, useTags } from "./hooks";
import type { ApplicationStatus } from "./model";

function buildFilters(search: {
  status?: ApplicationStatus;
  q?: string;
  tag?: number;
  remote?: boolean;
  company?: number;
}): ApplicationFiltersState {
  const filters: ApplicationFiltersState = {};

  if (search.status) filters.status = search.status;
  if (search.q) filters.q = search.q;
  if (search.tag !== undefined) filters.tag = search.tag;
  if (search.remote !== undefined) filters.remote = search.remote;
  if (search.company !== undefined) filters.company = search.company;

  return filters;
}

export function ApplicationsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: applicationsRoute.id });

  const filters = useMemo(() => buildFilters(search), [search]);

  const { data, isLoading, isError, error } = useApplications(filters);
  const { data: tagsResponse } = useTags();
  const { data: companiesResponse } = useCompanies();

  const applications = data?.data ?? [];
  const tags = tagsResponse?.data ?? [];
  const companies = useMemo(
    () =>
      (companiesResponse?.data ?? []).map((company) => ({
        id: company.id,
        name: company.name,
        website: company.website,
        location: company.location
      })),
    [companiesResponse]
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <ApplicationsFiltersBar
          filters={filters}
          tags={tags}
          companies={companies}
          onChange={(next) => {
            void navigate({
              to: "/applications",
              search: {
                status: next.status,
                q: next.q,
                tag: next.tag,
                remote: next.remote,
                company: next.company
              }
            });
          }}
          onReset={() => {
            void navigate({
              to: "/applications",
              search: { status: undefined, q: undefined, tag: undefined, remote: undefined, company: undefined }
            });
          }}
        />
      </Card>

      <Card className="p-4">
        {isLoading ? <p className="text-sm">Loading applications...</p> : null}
        {isError ? <p className="text-sm text-[var(--danger)]">Failed to load applications: {(error as Error).message}</p> : null}

        {!isLoading && !isError ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Remote</th>
                  <th className="pb-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--muted-foreground)]">No applications found.</td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application.id} className="border-t border-[var(--border)]">
                      <td className="py-3 font-medium">{application.title}</td>
                      <td className="py-3 text-[var(--muted-foreground)]">{application.company.name}</td>
                      <td className="py-3 capitalize">{application.status}</td>
                      <td className="py-3">{application.remote ? "Remote" : "Onsite"}</td>
                      <td className="py-3 text-[var(--muted-foreground)]">{application.applied_at ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
