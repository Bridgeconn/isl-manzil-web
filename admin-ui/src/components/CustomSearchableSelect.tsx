import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

interface CustomSearchableSelectProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: SelectOption | null;
  options: SelectOption[];
  onChange: (option: SelectOption | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  onInputChange?: (value: string) => void;
  orientation?: "vertical" | "horizontal";
  allowClear?: boolean;
}

import {
  useFloating,
  flip,
  shift,
  offset,
  autoUpdate,
  size,
} from "@floating-ui/react-dom";

const CustomSearchableSelect: React.FC<CustomSearchableSelectProps> = (
  props: CustomSearchableSelectProps,
) => {
  const {
    label,
    required,
    placeholder,
    value,
    options,
    onChange,
    disabled,
    isLoading,
    onInputChange,
    orientation = "vertical",
    allowClear = true,
  } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] =
    useState<SelectOption[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isHorizontal = orientation === "horizontal";
  // Floating UI positioning only
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  // Filter logic
  useEffect(() => {
    if (!search) {
      setFilteredOptions(options);
    } else {
      const lower = search.toLowerCase();
      setFilteredOptions(
        options.filter((opt) => opt.label.toLowerCase().includes(lower)),
      );
    }
  }, [search, options]);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      if (onInputChange) onInputChange("");
    }
  }, [open, onInputChange]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "gap-1",
        isHorizontal ? "flex flex-wrap items-center gap-3" : "flex flex-col",
      )}
    >
      {label && (
        <label
          className={cn(
            "block text-sm font-medium",
            isHorizontal ? "whitespace-nowrap mb-0" : "mb-1",
          )}
        >
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="text-red-500">
                {" "}
                *
              </span>
              <span className="sr-only">(required)</span>
            </>
          )}
        </label>
      )}

      <div
        className={cn(
          "relative w-full",
          isHorizontal && "flex-1 max-w-[230px]",
        )}
      >
        {/* Trigger Button */}
        <Button
          ref={(node) => {
            buttonRef.current = node;
            refs.setReference(node);
          }}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "w-full justify-between text-left font-normal bg-white border-gray-400/50",
            open && "ring-1 ring-sky-300 border-sky-100",
            !value && "text-muted-foreground",
          )}
        >
          <span
            className="block min-w-0 flex-1 truncate pr-6"
            title={value ? value.label : placeholder}
          >
            {value ? value.label : placeholder}
          </span>

          <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>

        {/* Clear Icon */}
        {allowClear && value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setSearch("");
              setOpen(false);
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 z-10"
          >
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        )}

        {/* Dropdown Menu - with Floating UI positioning */}
        {open && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden max-h-60 flex flex-col "
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (onInputChange) onInputChange(e.target.value);
                }}
                className="w-full h-8 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                    onInputChange?.("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  Loading...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No results found.
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt);
                      setSearch("");
                      setOpen(false);
                    }}
                    className={cn(
                      "px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:bg-gray-100",
                      value?.value === opt.value && "bg-sky-100 font-medium",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate" title={opt.label}>
                      {opt.label}
                    </span>
                    {value?.value === opt.value && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomSearchableSelect;
