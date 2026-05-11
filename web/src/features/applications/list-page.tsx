import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useCompanies } from "../companies/hooks";
import { applicationsRoute } from "../../routes/applications";
import { ApplicationsFiltersBar, type ApplicationFiltersState } from "./components/filters-bar";
import { toSearchFilters } from "./filters";
import { useApplications, useTags } from "./hooks";

export function ApplicationsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: applicationsRoute.id });

  const searchDebounceRef = useRef<number | null>(null);
  const filters = useMemo(() => ({ ...search }) as ApplicationFiltersState, [search]);

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

  useEffect(
    () => () => {
      if (searchDebounceRef.current !== null) {
        window.clearTimeout(searchDebounceRef.current);
      }
    },
    []
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
              search: toSearchFilters({ ...filters, ...next, page: undefined })
            });
          }}
          onSearchChange={(value) => {
            if (searchDebounceRef.current !== null) {
              window.clearTimeout(searchDebounceRef.current);
            }

            searchDebounceRef.current = window.setTimeout(() => {
              const trimmed = value.trim();
              void navigate({
                to: "/applications",
                search: toSearchFilters({ ...filters, q: trimmed || undefined, page: undefined })
              });
            }, 300);
          }}
          onReset={() => {
            void navigate({
              to: "/applications",
              search: toSearchFilters({})
            });
          }}
        />
      </Card>

      <Card className="p-4">
        {isLoading ? <p className="text-sm">Loading applications...</p> : null}
        {isError ? <p className="text-sm text-[var(--danger)]">Failed to load applications: {(error as Error).message}</p> : null}

        {!isLoading && !isError ? (
          <>
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
                      <tr
                        key={application.id}
                        className="cursor-pointer border-t border-[var(--border)] transition-colors hover:bg-[var(--muted)]/50"
                        onClick={() => {
                          void navigate({
                            to: "/applications/$id",
                            params: { id: application.id.toString() }
                          });
                        }}
                      >
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
            {data?.meta && (
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {applications.length === 0
                    ? "No applications"
                    : `Showing ${(data.meta.page - 1) * data.meta.per_page + 1}–${Math.min(data.meta.page * data.meta.per_page, data.meta.total)} of ${data.meta.total}`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.page === 1}
                    onClick={() => {
                      void navigate({
                        to: "/applications",
                        search: toSearchFilters({ ...filters, page: data.meta.page - 1 })
                      });
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.page * data.meta.per_page >= data.meta.total}
                    onClick={() => {
                      void navigate({
                        to: "/applications",
                        search: toSearchFilters({ ...filters, page: data.meta.page + 1 })
                      });
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </Card>
    </div>
  );
}
