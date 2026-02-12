import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Plus,
  RotateCcw,
} from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useUserRole } from "@/hooks/useUserRole";

// ---- Alignment helper (default = center) ----
type Align = "left" | "center" | "right" | "number";

/**
 * Alignment helper (default = center)
 * @param {Align} metaAlign - "left", "center", "right", "number"
 * @returns {{ text: string; justify: string }}
 */
const classesFor = (metaAlign?: Align): { text: string; justify: string } => {
  const align = metaAlign ?? "center"; // DEFAULT → center

  switch (align) {
    case "right":
    case "number":
      return { text: "text-right", justify: "justify-end" };
    case "left":
      return { text: "text-left", justify: "justify-start" };
    case "center":
    default:
      return { text: "text-center", justify: "justify-center" };
  }
};

interface DataTableProps<TData> {
  readonly columns: ColumnDef<TData>[];
  readonly data: TData[];
  readonly compareKeys?: string[];
  readonly compareKeyMap?: Record<string, string>;
  readonly isLoading?: boolean;
  readonly error?: string | null;
  readonly enableSorting?: boolean;
  readonly enableGlobalFilter?: boolean;
  readonly enableColumnFilters?: boolean;
  readonly enablePagination?: boolean;
  readonly paginationMode?: "client" | "server";
  readonly totalRows?: number;
  readonly pageSizes?: number[];
  readonly onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  readonly pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  readonly heading: string;
  readonly addButton?: boolean;
  readonly AddLabel?: string;
  readonly onAdd?: () => void;
  readonly onSearch?: (searchTerm: string) => void;
  readonly showRefresh?: boolean;
  readonly onRefresh?: () => void;
  readonly customFilters?: React.ReactNode[];
  readonly onTableReady?: (table: any) => void;
  readonly onClose?: () => void;
}

export function DataTable<TData>({
  columns,
  data,
  compareKeys,
  compareKeyMap,
  isLoading = false,
  error,
  enableSorting = true,
  enableGlobalFilter = true,
  enableColumnFilters = false,
  enablePagination = true,
  paginationMode = "client",
  totalRows,
  pageSizes = [10, 25, 50, 100],
  pagination,
  onPaginationChange,
  heading = "",
  addButton = false,
  AddLabel,
  onAdd,
  onSearch,
  showRefresh = false,
  onRefresh,
  customFilters = [],
  onTableReady,
  onClose,
}: DataTableProps<TData>) {
  const { isAdmin} = useUserRole();
  //const canEdit = isAdmin || isEditor;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [clientPagination, setClientPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSizes?.[0] ?? 10,
  });

  const effectivePagination =
    paginationMode === "server" ? pagination! : clientPagination;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  useEffect(() => {
    if (onSearch) {
      if (debouncedGlobalFilter.trim()) onSearch(debouncedGlobalFilter.trim());
      else onSearch("");
    }
  }, [debouncedGlobalFilter, onSearch]);

  const isClientPagination = paginationMode === "client" && enablePagination;
  const table = useReactTable({
    columns,
    data,
    state: {
      sorting,
      globalFilter: debouncedGlobalFilter,
      ...(enablePagination && { pagination: effectivePagination }),
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onGlobalFilterChange: enableGlobalFilter ? setGlobalFilter : undefined,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(effectivePagination) : updater;

      if (paginationMode === "server") {
        onPaginationChange?.(next);
      } else {
        setClientPagination(next);
      }
    },

    pageCount:
      paginationMode === "server" && totalRows
        ? Math.max(1, Math.ceil(totalRows / effectivePagination.pageSize))
        : undefined,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel:
      enableGlobalFilter || enableColumnFilters
        ? getFilteredRowModel()
        : undefined,
    getPaginationRowModel: isClientPagination
      ? getPaginationRowModel()
      : undefined,
    manualPagination: paginationMode === "server",
    defaultColumn: { enableSorting: false },
    enableColumnFilters,
  });

  const clearFilter = () => setGlobalFilter("");

  const getAddButtonText = (heading: string) => {
    if (!heading) return "Add";
    let singular = heading;
    if (heading.toLowerCase().endsWith("s") && heading.length > 1) {
      singular = heading.slice(0, -1);
    }
    const capitalized = singular.charAt(0).toUpperCase() + singular.slice(1);
    return `Add ${capitalized}`;
  };

  const displayedFilters = customFilters.slice(0, 4);

  useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  return (
    <>
      <div className="flex justify-between sm:items-center gap-4 pr-1">
        <div className="flex items-center justify-between mb-2 gap-4 flex-wrap flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h1 className="text-3xl font-bold mb-1">{heading}</h1>
            {showRefresh && onRefresh && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefresh}
                className="flex items-center gap-1 cursor-pointer"
                type="button"
                title="Refresh"
              >
                <RotateCcw className="h-4 w-4" />
                {/* Refresh */}
              </Button>
            )}
          </div>
          {(displayedFilters.length > 0 || enableGlobalFilter) && (
            <div className="flex items-center justify-end gap-2 flex-wrap sm:ml-auto">
              {displayedFilters.map((filter, index) => (
                <div key={index} className="flex-shrink-0">
                  {filter}
                </div>
              ))}
              {enableGlobalFilter && (
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="px-10 py-2 w-50 border border-gray-400"
                    autoFocus={false}
                  />
                  {globalFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilter}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          {addButton && isAdmin && (
  <Button
    onClick={onAdd}
    variant="outline"
    className="flex items-center gap-2 cursor-pointer"
  >
    <Plus className="h-4 w-4" />
    {AddLabel ?? getAddButtonText(heading)}
  </Button>
)}

        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-mr-1 mb-2 h-6 w-6 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      <div className="bg-white shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 mr-1">
        <div className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {(isLoading || error || table.getRowModel().rows.length === 0) && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center z-10 bg-white ${
                error ? "bg-red-50!" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="mt-4 text-gray-600">Loading...</span>
                </>
              ) : error ? (
                <>
                  <p className="text-lg text-red-600">Error loading data</p>
                  <p className="text-sm text-red-500 mt-1">{error}</p>
                </>
              ) : (
                <p className="text-gray-500">
                  {debouncedGlobalFilter
                    ? `No results found for "${debouncedGlobalFilter}"`
                    : "No data found"}
                </p>
              )}
            </div>
          )}

          {/* TABLE */}
          <table className="min-w-full border-collapse table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const cls = classesFor(
                      header.column.columnDef.meta?.align as Align | undefined,
                    );
                    const columnId = header.column.id;

                    const canonicalKey = compareKeyMap?.[columnId] ?? columnId;

                    const isCompareKey = compareKeys?.includes(canonicalKey);

                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`w-[150px] px-4 py-2 text-sm font-medium border-b border-gray-200 ${cls.text}`}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            onClick={
                              enableSorting && header.column.getCanSort()
                                ? header.column.getToggleSortingHandler()
                                : undefined
                            }
                            className={`flex w-full items-center gap-1 font-semibold select-none ${
                              cls.justify
                            } ${
                              enableSorting && header.column.getCanSort()
                                ? "cursor-pointer"
                                : ""
                            }`}
                          >
                            <span
                              className={isCompareKey ? "text-sky-700" : ""}
                              title={
                                isCompareKey ? "Primary column" : undefined
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </span>

                            {enableSorting &&
                              header.column.getCanSort() &&
                              (header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              ))}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody
              className={
                isLoading || error || table.getRowModel().rows.length === 0
                  ? "opacity-0 pointer-events-none"
                  : ""
              }
            >
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 border-b border-gray-100"
                >
                  {row.getVisibleCells().map((cell) => {
                    const cls = classesFor(
                      cell.column.columnDef.meta?.align as Align | undefined,
                    );
                    return (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 text-sm text-gray-700 ${cls.text}`}
                      >
                        <div className="overflow-hidden text-ellipsis">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {enablePagination && (
        <DataTablePagination
          table={table}
          paginationMode={paginationMode}
          totalRows={
            isClientPagination
              ? table.getFilteredRowModel().rows.length
              : totalRows
          }
          pageSizes={pageSizes}
        />
      )}
    </>
  );
}
