import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DuplicateCsvDialogProps } from "@/utils/types";

export function DuplicateCsvDialog({
  open,
  compareKeys,
  duplicates,
  onClose,
}: DuplicateCsvDialogProps) {
  const formatted = duplicates
    .map((d,i) => {
      const first = d.values[0];
      const display =
        compareKeys.length > 1
          ? compareKeys.map((k) => first[k]).join(", ")
          : first[compareKeys[0]];

      return `${i+1}) ${display} (${d.values.length} occurrences)`;
    })
    .join("\n");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <h2 className="text-lg font-semibold text-red-600">
            Unable to upload CSV data
          </h2>
        </DialogHeader>

        <div className="text-sm text-gray-800 space-y-2 mt-2">
          <p>
            <strong>{compareKeys.join(" + ")}</strong> combination must be
            unique. The uploaded CSV contains duplicate record(s).
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Below {duplicates.length > 1 ? "are" : "is"} the repeated{" "}
            {compareKeys.length > 1 ? "combination" : "value"}
            {duplicates.length > 1 ? "s" : ""} with the number of occurrences:
          </p>

          <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap max-h-50 overflow-y-auto custom-scrollbar">
            {formatted}
          </pre>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="cursor-pointer">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
