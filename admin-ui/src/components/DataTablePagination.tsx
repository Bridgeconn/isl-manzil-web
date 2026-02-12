import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  readonly table: Table<TData>;
  readonly paginationMode?: "client" | "server";
  readonly totalRows?: number;
  readonly pageSizes?: number[];
}

export function DataTablePagination<TData>({
  table,
  paginationMode = "client",
  totalRows,
  pageSizes,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const isServer = paginationMode === "server";
  const total = isServer
    ? totalRows ?? 0
    : table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const showingFrom = total === 0 ? 0 : pageIndex * pageSize + 1;
  const showingTo = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between py-3">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong>{" "}
          of <strong>{total}</strong> results
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Show:</span>
        <select
          className="border border-gray-300 rounded px-1 py-1 text-sm cursor-pointer"
          value={pageSize}
          onChange={(e) => {
            table.setPageIndex(0);
            table.setPageSize(Number(e.target.value));
          }}
        >
          {pageSizes?.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={
            paginationMode === "client"
              ? !table.getCanPreviousPage()
              : pageIndex === 0
          }
          className="p-2 cursor-pointer"
          title="First page"
        >
          {"<<"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={
            paginationMode === "client"
              ? () => table.previousPage()
              : () => table.setPageIndex(pageIndex - 1)
          }
          disabled={
            paginationMode === "client"
              ? !table.getCanPreviousPage()
              : pageIndex === 0
          }
          className="p-2 cursor-pointer"
          title="Previous page"
        >
          {"<"}
        </Button>

        <div className="text-sm text-gray-700">
          Page <strong>{pageIndex + 1}</strong> of{" "}
          <strong>{table.getPageCount()}</strong>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={
            paginationMode === "client"
              ? () => table.nextPage()
              : () => table.setPageIndex(pageIndex + 1)
          }
          disabled={
            paginationMode === "client"
              ? !table.getCanNextPage()
              : pageIndex + 1 >= pageCount
          }
          className="p-2 cursor-pointer"
          title="Next page"
        >
          {">"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={
            paginationMode === "client"
              ? !table.getCanNextPage()
              : pageIndex + 1 >= pageCount
          }
          className="p-2 cursor-pointer"
          title="Last page"
        >
          {">>"}
        </Button>
      </div>
    </div>
  );
}
