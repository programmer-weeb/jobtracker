import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";

const noteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(1000, "Note too long")
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteComposerProps {
  onSubmit: (body: string) => Promise<void>;
  isSaving: boolean;
}

export function NoteComposer({ onSubmit, isSaving }: NoteComposerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { body: "" }
  });

  return (
    <form
      className="space-y-2"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values.body);
        reset();
      })}
    >
      <textarea
        {...register("body")}
        className="min-h-28 w-full rounded-[18px] border border-[var(--border)] bg-white p-4 text-[17px] outline-none"
        placeholder="Add note"
      />
      {errors.body ? <p className="text-xs text-[var(--danger)]">{errors.body.message}</p> : null}
      <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add note"}</Button>
    </form>
  );
}
