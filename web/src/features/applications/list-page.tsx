import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useCompanies } from "../companies/hooks";
import { applicationsRoute } from "../../routes/applications";
import { ApplicationsFiltersBar, type ApplicationFiltersState } from "./components/filters-bar";
import { CreateApplicationForm } from "./components/create-application-form";
import { toSearchFilters } from "./filters";
import { useApplications, useCreateApplication, useCreateTag, useDeleteTag, useTags } from "./hooks";

export function ApplicationsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: applicationsRoute.id });

  const searchDebounceRef = useRef<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const filters = useMemo(() => ({ ...search }) as ApplicationFiltersState, [search]);

  const { data, isLoading, isError, error } = useApplications(filters);
  const { data: tagsResponse } = useTags();
  const { data: companiesResponse } = useCompanies();
  const createApplicationMutation = useCreateApplication();
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();

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
      <section className="mx-[calc(50%-50vw)] -mt-6 bg-[var(--surface-tile-1)] px-4 py-16 text-center text-white md:-mt-8 md:px-8">
        <h1 className="apple-display mx-auto max-w-4xl text-[40px] leading-[1.1] md:text-[56px]">Every application, sharply in view.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[24px] font-light leading-normal text-[var(--body-muted-dark)]">
          Search, filter, and open the exact role record you need.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => setIsCreateOpen(true)}>New application</Button>
        </div>
      </section>

      {isCreateOpen ? (
        <Card className="p-4 md:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="apple-display text-[28px] leading-tight">Create application</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Add a role to the tracker and place it on the board.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
              Close
            </Button>
          </div>
          <CreateApplicationForm
            companies={companies}
            tags={tags}
            isSaving={createApplicationMutation.isPending || createTagMutation.isPending || deleteTagMutation.isPending}
            onCancel={() => setIsCreateOpen(false)}
            onCreateTag={async (name) => {
              const response = await createTagMutation.mutateAsync({ name, color: "#0066cc" });
              return response.data;
            }}
            onDeleteTag={async (tagId) => {
              await deleteTagMutation.mutateAsync(tagId);
            }}
            onSubmit={async (values) => {
              await createApplicationMutation.mutateAsync(values);
              setIsCreateOpen(false);
            }}
          />
          {createApplicationMutation.isError ? (
            <p className="mt-3 text-sm text-[var(--danger)]">Could not create application. Check the fields and try again.</p>
          ) : null}
        </Card>
      ) : null}

      <Card className="p-4 md:p-6">
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

      <Card className="overflow-hidden p-0">
        {isLoading ? <p className="text-sm">Loading applications...</p> : null}
        {isError ? <p className="text-sm text-[var(--danger)]">Failed to load applications: {(error as Error).message}</p> : null}

        {!isLoading && !isError ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[var(--canvas-parchment)]">
                  <tr className="text-[var(--muted-foreground)]">
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Company</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Remote</th>
                    <th className="px-5 py-4 font-semibold">Applied</th>
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
                        className="cursor-pointer border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-pearl)]"
                        onClick={() => {
                          void navigate({
                            to: "/applications/$id",
                            params: { id: application.id.toString() }
                          });
                        }}
                      >
                        <td className="px-5 py-4 font-semibold">{application.title}</td>
                        <td className="px-5 py-4 text-[var(--muted-foreground)]">{application.company.name}</td>
                        <td className="px-5 py-4 capitalize">{application.status}</td>
                        <td className="px-5 py-4">{application.remote ? "Remote" : "Onsite"}</td>
                        <td className="px-5 py-4 text-[var(--muted-foreground)]">{application.applied_at ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {data?.meta && (
              <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-4">
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
