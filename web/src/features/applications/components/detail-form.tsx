import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { Application, TagSummary } from "../model";
import { TagSelector } from "./tag-selector";

const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  source: z.string().trim().max(120, "Source too long").optional().or(z.literal("")),
  salary_min: z.string().optional().or(z.literal("")),
  salary_max: z.string().optional().or(z.literal("")),
  currency: z.string().trim().max(10, "Currency too long").optional().or(z.literal("")),
  remote: z.boolean(),
  location: z.string().trim().max(200, "Location too long").optional().or(z.literal("")),
  url: z.string().trim().url("Must be valid URL").optional().or(z.literal("")),
  applied_at: z.string().optional().or(z.literal("")),
  tag_ids: z.array(z.number())
});

type FormValues = z.infer<typeof formSchema>;

interface DetailFormProps {
  application: Application;
  availableTags: TagSummary[];
  isSaving: boolean;
  onSubmit: (values: {
    title: string;
    source: string | null;
    salary_min: number | null;
    salary_max: number | null;
    currency: string | null;
    remote: boolean;
    location: string | null;
    url: string | null;
    applied_at: string | null;
    tag_ids: number[];
  }) => Promise<void>;
}

function toNullableNumber(value: string | undefined): number | null {
  const next = value?.trim() ?? "";
  if (!next) {
    return null;
  }
  const parsed = Number(next);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: string | undefined): string | null {
  const next = value?.trim() ?? "";
  return next ? next : null;
}

export function DetailForm({ application, availableTags, isSaving, onSubmit }: DetailFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: application.title,
      source: application.source ?? "",
      salary_min: application.salary_min?.toString() ?? "",
      salary_max: application.salary_max?.toString() ?? "",
      currency: application.currency ?? "",
      remote: application.remote,
      location: application.location ?? "",
      url: application.url ?? "",
      applied_at: application.applied_at ? application.applied_at.slice(0, 10) : "",
      tag_ids: application.tags.map((tag) => tag.id)
    }
  });

  useEffect(() => {
    register("tag_ids");
  }, [register]);

  useEffect(() => {
    reset({
      title: application.title,
      source: application.source ?? "",
      salary_min: application.salary_min?.toString() ?? "",
      salary_max: application.salary_max?.toString() ?? "",
      currency: application.currency ?? "",
      remote: application.remote,
      location: application.location ?? "",
      url: application.url ?? "",
      applied_at: application.applied_at ? application.applied_at.slice(0, 10) : "",
      tag_ids: application.tags.map((tag) => tag.id)
    });
  }, [application, reset]);

  const selectedTagIds = useWatch({ control, name: "tag_ids" });

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          title: values.title.trim(),
          source: toNullableString(values.source),
          salary_min: toNullableNumber(values.salary_min),
          salary_max: toNullableNumber(values.salary_max),
          currency: toNullableString(values.currency),
          remote: values.remote,
          location: toNullableString(values.location),
          url: toNullableString(values.url),
          applied_at: toNullableString(values.applied_at),
          tag_ids: values.tag_ids
        });
      })}
    >
      <Input {...register("title")} placeholder="Title" />
      {errors.title ? <p className="text-xs text-[var(--danger)]">{errors.title.message}</p> : null}

      <Input {...register("source")} placeholder="Source" />
      <div className="grid gap-3 md:grid-cols-3">
        <Input {...register("salary_min")} type="number" placeholder="Salary min" />
        <Input {...register("salary_max")} type="number" placeholder="Salary max" />
        <Input {...register("currency")} placeholder="Currency" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input {...register("location")} placeholder="Location" />
        <Input {...register("url")} placeholder="URL" />
      </div>
      {errors.url ? <p className="text-xs text-[var(--danger)]">{errors.url.message}</p> : null}

      <Input {...register("applied_at")} type="date" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("remote")} /> Remote
      </label>

      <TagSelector
        tags={availableTags}
        selectedIds={selectedTagIds ?? []}
        onChange={(tagIds) => setValue("tag_ids", tagIds)}
        disabled={isSaving}
      />

      <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button>
    </form>
  );
}
