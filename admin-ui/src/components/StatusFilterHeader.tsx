import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useEffect, useRef, useState } from "react";

function StatusFilterHeader({
  column,
  status_options,
  defaultFilter,
  onFilterChange,
}: {
  column: any;
  status_options: string[];
  defaultFilter?: string[];
  onFilterChange?: (filter: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentFilter = column.getFilterValue() ?? [];
  const initialized = useRef(false);

  useEffect(() => {
    if (defaultFilter && !initialized.current) {
      column.setFilterValue(defaultFilter);
      initialized.current = true;
    }
  }, [defaultFilter, column]);

  const toggleStatus = (status: string) => {
    let updated;
    if (currentFilter.includes(status)) {
      updated = currentFilter.filter((s: string) => s !== status);
    } else {
      updated = [...currentFilter, status];
    }

    column.setFilterValue(updated);
    onFilterChange?.(updated);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 cursor-pointer"
        >
          Status {currentFilter.length ? `(${currentFilter.length})` : ""} ▼
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-3 space-y-2 max-w-30 text-sm">
        {status_options.map((status) => (
          <label
            key={status}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={currentFilter.includes(status)}
              onChange={() => toggleStatus(status)}
            />
            <span className="capitalize">{status}</span>
          </label>
        ))}

        {currentFilter.length > 0 && (
          <button
            className="text-xs text-blue-600 underline mt-2 cursor-pointer"
            onClick={() => {
              column.setFilterValue([]);
              onFilterChange?.([]);
            }}
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default StatusFilterHeader;
