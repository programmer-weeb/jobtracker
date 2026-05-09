import { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isPending = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="confirm-dialog-overlay">
      <Card
        ref={dialogRef}
        className="w-full max-w-sm space-y-4 p-6 shadow-lg"
        role="alertdialog"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-gray-600">{description}</p>}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="confirm-dialog-cancel"
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-dialog-confirm"
          >
            {isPending ? "..." : confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
