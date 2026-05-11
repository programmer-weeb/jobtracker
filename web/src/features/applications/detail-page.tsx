import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { queryKeys } from "../../lib/query-keys";
import { Card } from "../../components/ui/card";
import { ConfirmDialog } from "../../components/confirm-dialog";
import {
  sortNotes,
  useApplication,
  useCreateNote,
  useDeleteNote,
  useTags,
  useUpdateApplication,
  useMoveApplication
} from "./hooks";
import { DetailHeader } from "./components/detail-header";
import { DetailForm } from "./components/detail-form";
import { NoteComposer } from "./components/note-composer";
import { NotesList } from "./components/notes-list";
import { ActivityTimeline } from "./components/activity-timeline";

export function ApplicationDetailPage() {
  const { id } = useParams({ from: "/authenticated/applications/$id" });
  const applicationId = Number(id);
  const queryClient = useQueryClient();

  const [deleteNoteDialogOpen, setDeleteNoteDialogOpen] = useState(false);
  const [pendingNoteId, setPendingNoteId] = useState<number | null>(null);

  const detailQuery = useApplication(applicationId);
  const tagsQuery = useTags();
  const updateMutation = useUpdateApplication();
  const moveMutation = useMoveApplication();
  const createNoteMutation = useCreateNote(applicationId);
  const deleteNoteMutation = useDeleteNote(applicationId);

  if (detailQuery.isLoading) {
    return <p className="text-sm">Loading application...</p>;
  }

  if (detailQuery.isError) {
    return <p className="text-sm text-[var(--danger)]">Failed to load application.</p>;
  }

  const application = detailQuery.data?.data;

  if (!application) {
    return <p className="text-sm text-[var(--muted-foreground)]">Application not found.</p>;
  }

  const notes = sortNotes(application.notes ?? []);

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card className="space-y-4 p-4 md:p-6">
          <DetailHeader application={application} />
          <DetailForm
            application={application}
            availableTags={tagsQuery.data?.data ?? []}
            isSaving={updateMutation.isPending || moveMutation.isPending}
            onSubmit={async (values) => {
              const { status, ...updateValues } = values;
              
              if (status !== application.status) {
                await moveMutation.mutateAsync({
                  id: application.id,
                  status: status,
                  position: 0,
                  fromStatus: application.status
                });
              }
              
              await updateMutation.mutateAsync({ id: application.id, application: updateValues });
              
              // Force a clean refetch to ensure status and new events are fully loaded
              await queryClient.invalidateQueries({ queryKey: queryKeys.applicationDetail(application.id) });
            }}
          />
          {updateMutation.isError ? <p className="text-xs text-[var(--danger)]">Save failed. Try again.</p> : null}
          {tagsQuery.isError ? <p className="text-xs text-[var(--danger)]">Tags failed to load.</p> : null}
        </Card>

        <Card className="space-y-4 p-4 md:p-6">
          <h2 className="text-lg font-semibold">Notes</h2>
          <NoteComposer
            isSaving={createNoteMutation.isPending}
            onSubmit={async (body) => {
              await createNoteMutation.mutateAsync(body);
            }}
          />
          {createNoteMutation.isError ? <p className="text-xs text-[var(--danger)]">Could not add note.</p> : null}
          <NotesList
            notes={notes}
            deletingId={deleteNoteMutation.variables}
            onDelete={(noteId) => {
              setPendingNoteId(noteId);
              setDeleteNoteDialogOpen(true);
            }}
          />
          {deleteNoteMutation.isError ? <p className="text-xs text-[var(--danger)]">Could not delete note.</p> : null}
        </Card>
      </div>

      <Card className="h-fit space-y-3 p-4 md:p-6">
        <h2 className="text-lg font-semibold">Activity</h2>
        <ActivityTimeline application={application} />
      </Card>

      <ConfirmDialog
        isOpen={deleteNoteDialogOpen}
        title="Delete Note"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        isPending={deleteNoteMutation.isPending}
        onConfirm={() => {
          if (pendingNoteId) {
            deleteNoteMutation.mutate(pendingNoteId);
            setDeleteNoteDialogOpen(false);
          }
        }}
        onCancel={() => {
          setDeleteNoteDialogOpen(false);
          setPendingNoteId(null);
        }}
      />
    </div>
  );
}
