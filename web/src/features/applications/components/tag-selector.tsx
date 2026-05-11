import { useState } from "react";
import type { TagSummary } from "../model";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

interface TagSelectorProps {
  tags: TagSummary[];
  selectedIds: number[];
  onChange: (tagIds: number[]) => void;
  onCreateTag?: (name: string) => Promise<TagSummary>;
  onDeleteTag?: (tagId: number) => Promise<void>;
  disabled?: boolean;
}

export function TagSelector({
  tags,
  selectedIds,
  onChange,
  onCreateTag,
  onDeleteTag,
  disabled = false
}: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState("");
  const [busyTagId, setBusyTagId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tagId: number) => {
    const isSelected = selectedIds.includes(tagId);
    if (isSelected) {
      onChange(selectedIds.filter((id) => id !== tagId));
      return;
    }
    onChange([...selectedIds, tagId]);
  };

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name || !onCreateTag) return;

    setError(null);
    setIsCreating(true);
    try {
      const tag = await onCreateTag(name);
      onChange([...new Set([...selectedIds, tag.id])]);
      setNewTagName("");
    } catch {
      setError("Could not create tag.");
    } finally {
      setIsCreating(false);
    }
  };

  const removeTag = async (tagId: number) => {
    if (!onDeleteTag) return;

    setError(null);
    setBusyTagId(tagId);
    try {
      await onDeleteTag(tagId);
      onChange(selectedIds.filter((id) => id !== tagId));
    } catch {
      setError("Could not delete tag.");
    } finally {
      setBusyTagId(null);
    }
  };

  const isDisabled = disabled || isCreating || busyTagId !== null;

  return (
    <div className="space-y-3">
      {onCreateTag ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void createTag();
              }
            }}
            placeholder="New tag"
            aria-label="New tag name"
            disabled={isDisabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void createTag()}
            disabled={isDisabled || !newTagName.trim()}
          >
            Add tag
          </Button>
        </div>
      ) : null}

      {!tags.length ? (
        <p className="text-sm text-[var(--muted-foreground)]">No tags available.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selectedIds.includes(tag.id);
            return (
              <span
                key={tag.id}
                className={`inline-flex min-h-9 items-center overflow-hidden rounded-full border text-xs tracking-[-0.12px] ${active ? "border-[var(--ring)] bg-[var(--brand)] text-white" : "border-[var(--border)] bg-white text-[var(--foreground)]"}`}
              >
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleTag(tag.id)}
                  className="min-h-9 px-4 py-2"
                >
                  {tag.name}
                </button>
                {onDeleteTag ? (
                  <button
                    type="button"
                    disabled={isDisabled}
                    aria-label={`Delete tag ${tag.name}`}
                    onClick={() => void removeTag(tag.id)}
                    className={`min-h-9 border-l px-3 ${active ? "border-white/25" : "border-[var(--border)] text-[var(--muted-foreground)]"}`}
                  >
                    {busyTagId === tag.id ? "..." : "x"}
                  </button>
                ) : null}
              </span>
            );
          })}
        </div>
      )}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
