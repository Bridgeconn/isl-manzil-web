import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import type { FinalDeleteConfirmDialogProps } from "@/utils/types";

export default function FinalDeleteConfirmDialog({
  open,
  onOpenChange,
  requiredName,
  requiredPhrase,
  onConfirm,
  loading,
  errorText,
  onClearError,
  title,
  subtitle,
  dangerButtonText,
  cancelButtonText,
}: FinalDeleteConfirmDialogProps) {
  const [nameInput, setNameInput] = useState("");
  const [phraseInput, setPhraseInput] = useState("");

  useEffect(() => {
    if (open) {
      setNameInput("");
      setPhraseInput("");
    } else {
      onClearError?.();
    }
  }, [open]);

  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

  const disabled =
    loading ||
    normalize(nameInput) !== normalize(requiredName) ||
    normalize(phraseInput).toLowerCase() !==
      normalize(requiredPhrase).toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Type <span className="font-semibold">“{requiredName}”</span>
            </label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
              placeholder={requiredName}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 ">
              Type <span className="font-semibold">“{requiredPhrase}”</span>
            </label>
            <input
              value={phraseInput}
              onChange={(e) => setPhraseInput(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
              placeholder={requiredPhrase}
              disabled={loading}
            />
          </div>

          <div
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            <CircleAlert
              className="h-4 w-4 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <p>
              Deleting <span className="font-semibold">{requiredName}</span> is
              permanent and cannot be undone.
            </p>
          </div>

          {errorText && <p className="text-sm text-red-600">{errorText}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelButtonText}
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-white ${
                disabled
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              disabled={disabled}
              onClick={onConfirm}
            >
              {dangerButtonText}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
