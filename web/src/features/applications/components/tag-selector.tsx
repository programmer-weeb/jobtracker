import type { TagSummary } from "../model";

interface TagSelectorProps {
  tags: TagSummary[];
  selectedIds: number[];
  onChange: (tagIds: number[]) => void;
  disabled?: boolean;
}

export function TagSelector({ tags, selectedIds, onChange, disabled = false }: TagSelectorProps) {
  const toggleTag = (tagId: number) => {
    const isSelected = selectedIds.includes(tagId);
    if (isSelected) {
      onChange(selectedIds.filter((id) => id !== tagId));
      return;
    }
    onChange([...selectedIds, tagId]);
  };

  if (!tags.length) {
    return <p className="text-sm text-[var(--muted-foreground)]">No tags available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={disabled}
            onClick={() => toggleTag(tag.id)}
            className={`min-h-9 rounded-full border px-4 py-2 text-xs tracking-[-0.12px] ${active ? "border-[var(--ring)] bg-[var(--brand)] text-white" : "border-[var(--border)] bg-white text-[var(--foreground)]"}`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
