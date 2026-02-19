import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/Datatable";
import { useUserRole } from "@/hooks/useUserRole";
import { batchProcess } from "@/utils/batchProcessor";
import type { UploadOrViewDialogProps } from "@/utils/types";
import StatusFilterHeader from "@/components/StatusFilterHeader";
import { extractErrorMessage } from "@/utils/errorUtils";
import { DeleteDialog } from "./DeleteDialog";
import { RemoteDataResultDialog } from "./RemoteDataDialog";

export default function UploadOrViewDialog<T>({
  open,
  onOpenChange,
  title,
  resourceId,
  viewData,
  parsedPreview = [],
  uploadFunc,
  updateFunc,
  deleteFunc,
  requiredHeaders = [],
  columns = [],
  buildCreatePayload,
  buildUpdatePayload,
  contentType,
  onRequestFilePick,
  compareKeys,
  compareKeyMap,
  identityKey,
  normalizeApiRow = (row: any) => row,
  clearPreview,
  remoteTestConfig,
}: UploadOrViewDialogProps<T>) {
  const [isUploading, setIsUploading] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string[]>([
    "New",
    "Updated",
  ]);
  const { isAdmin, isEditor } = useUserRole();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [remoteOpen, setRemoteOpen] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteRows, setRemoteRows] = useState<any[]>([]);
  const [remoteSummary, setRemoteSummary] = useState<React.ReactNode>(null);

  const uploadMutation = uploadFunc();
  const updateMutation = updateFunc();
  const deleteMutation = deleteFunc();

  useEffect(() => {
    if (!open) setIsUploading(false);
  }, [open]);

  const hasPreview = Array.isArray(parsedPreview) && parsedPreview.length > 0;
  const hasViewData =
    viewData && Array.isArray(viewData) && viewData.length > 0;

  const mode: "preview" | "view" | "empty" = hasPreview
    ? "preview"
    : hasViewData
      ? "view"
      : "empty";

  const previewWithExistingData = mode === "preview" && hasViewData;

  const dialogTitle = mode === "preview" ? `${title} - Preview` : title;

  const normalizedViewData =
    viewData?.map((r: any) => normalizeApiRow(r)) ?? [];

  const STATUS_OPTIONS = ["New", "Updated", "No Change"];

  const rowsAreIdentical = (a: any, b: any) =>
    Object.keys(a).every(
      (k) => String(a[k] ?? "").trim() === String(b[k] ?? "").trim(),
    );

  // Marks a CSV row as a true duplicate ONLY if ALL columns match
  const isTrueDuplicate = (row: any, rows: any[]) =>
    rows.filter(
      (candidate) =>
        compareKeys.every(
          (k) =>
            String(candidate[k] ?? "")
              .trim()
              .toLowerCase() ===
            String(row[k] ?? "")
              .trim()
              .toLowerCase(),
        ) && rowsAreIdentical(candidate, row),
    ).length > 1;

  // Detect field-level changes between CSV row and existing row for update marking
  const rowHasChanged = (existing: any, incoming: any) =>
    Object.keys(incoming)
      .filter((k) => !compareKeys.includes(k))
      .some(
        (k) =>
          String(existing[k] ?? "").trim() !== String(incoming[k] ?? "").trim(),
      );

  // table data with status column
  const tableData = useMemo(() => {
    if (!hasPreview) return normalizedViewData;

    const { matchedRows } = batchProcess({
      csvRows: parsedPreview,
      existingRows: normalizedViewData,
      compareKeys,
      identityKey,
    });

    console.log("Matched Rows:", matchedRows);
    // Build a lookup map: CSV row → matched data
    const csvToMatchMap = new Map<T, (typeof matchedRows)[0]>();
    matchedRows.forEach((match) => {
      csvToMatchMap.set(match.incoming, match);
    });

    return parsedPreview.map((row) => {
      // Check for true duplicates within CSV
      if (isTrueDuplicate(row, parsedPreview))
        return { ...row, status: "Duplicate" };

      const match = csvToMatchMap.get(row);

      if (match) {
        // Matched to existing row - check if changed
        const hasChanged = rowHasChanged(match.existing, row);
        return { ...row, status: hasChanged ? "Updated" : "No Change" };
      } else {
        // No match found = new row
        return { ...row, status: "New" };
      }
    });
  }, [parsedPreview, normalizedViewData, overwrite, hasPreview]);

  useEffect(() => {
    if (!open || !hasPreview) return;

    const hasNewRows = tableData.some((r: any) => r.status === "New");
    const hasUpdatedRows = tableData.some((r: any) => r.status === "Updated");

    if (!hasNewRows && !hasUpdatedRows) {
      toast.info("No new or updated rows found.");
      clearPreview?.();
    }
  }, [tableData, open, hasPreview]);

  const hasUpdatedRows = tableData.some((r: any) => r.status === "Updated");

  const columnsWithStatus: ColumnDef<T & { status?: string }>[] =
    useMemo(() => {
      if (!previewWithExistingData)
        return columns as ColumnDef<T & { status?: string }>[];

      const helper = createColumnHelper<T & { status?: string }>();
      return [
        ...(columns as ColumnDef<T & { status?: string }>[]),
        helper.accessor((row) => row.status, {
          id: "status",
          header: ({ column }) => (
            <StatusFilterHeader
              column={column}
              status_options={STATUS_OPTIONS}
              defaultFilter={["New", "Updated"]}
              onFilterChange={(val) => setActiveStatusFilter(val)}
            />
          ),
          cell: (info) => info.getValue() || "",
          enableColumnFilter: true,
          meta: { align: "center" },
          filterFn: (row, columnId, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(row.getValue(columnId));
          },
        }),
      ] as ColumnDef<T & { status?: string }>[];
    }, [columns, previewWithExistingData]);

  // handle upload action
  const handleUpload = async () => {
    try {
      setIsUploading(true);

      const newRows = tableData.filter((r: any) => r.status === "New");
      const updatedRows = tableData.filter((r: any) => r.status === "Updated");

      let created = false;
      let updated = false;

      // CREATE
      if (newRows.length > 0) {
        const payload = buildCreatePayload(newRows, resourceId);
        await uploadMutation.mutateAsync(payload);
        created = true;
      }

      // UPDATE only if overwrite ON
      if (overwrite && updatedRows.length > 0) {
        // Build lookup for matched rows with their IDs
        const { matchedRows } = batchProcess({
          csvRows: parsedPreview,
          existingRows: normalizedViewData,
          compareKeys,
          identityKey,
        });

        // Map each CSV row (by reference) → ID using strict equality
        const csvRowToIdMap = new Map<T, any>();
        matchedRows.forEach((match) => {
          csvRowToIdMap.set(match.incoming, match.identityValue);
        });

        const finalRows = updatedRows
          .map((rowWithStatus: any) => {
            // Find the index of this row in tableData
            const tableDataIndex = tableData.findIndex((td: any) => {
              // Compare all properties except status to find the exact match
              return Object.keys(rowWithStatus).every((key) => {
                if (key === "status") return true;
                return td[key] === rowWithStatus[key];
              });
            });

            if (tableDataIndex === -1) return null;

            // Get the corresponding original CSV row at the same index
            const originalCsvRow = parsedPreview[tableDataIndex];

            // Look up the ID using the original CSV row reference
            const id = csvRowToIdMap.get(originalCsvRow);

            return id !== undefined
              ? { ...rowWithStatus, [identityKey]: id }
              : null;
          })
          .filter(Boolean);

        if (finalRows.length > 0) {
          const payload = buildUpdatePayload(finalRows as T[], resourceId);
          await updateMutation.mutateAsync(payload);
          updated = true;
        }
      }

      // Toast messages
      if (created && !updated) {
        toast.success(`${contentType} uploaded successfully`);
      } else if (!created && updated) {
        toast.success(`${contentType} updated successfully`);
      } else if (created && updated) {
        toast.success(`${contentType} uploaded and updated successfully`);
      } else {
        toast.info(`No new ${contentType} to upload`);
      }

      onOpenChange(false);
    } catch (err: any) {
      const errMsg = extractErrorMessage(err);
      toast.error(errMsg ?? `Failed to upload ${contentType}`);
    } finally {
      setIsUploading(false);
      setOverwrite(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsUploading(true);

      const idsToDelete = normalizedViewData.map((r: any) => r[identityKey]);

      const response = await deleteMutation.mutateAsync({
        resource_id: resourceId,
        ids: idsToDelete,
      });

      const deleteResp = response?.message;

      toast.success(
        deleteResp || `All ${contentType} rows deleted successfully`,
      );

      setDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch (err: any) {
      const errMsg = extractErrorMessage(err);
      toast.error(errMsg ?? `Failed to delete old ${contentType} rows`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    let rows: T[] | undefined = parsedPreview;

    if ((!rows || rows.length === 0) && viewData?.length) {
      rows = viewData.map((row: any) =>
        normalizeApiRow ? normalizeApiRow(row) : row,
      );
    }

    if (!rows || rows.length === 0) {
      toast.error("No data available to download");
      return;
    }

    const filteredRows: Record<string, any>[] = requiredHeaders?.length
      ? rows.map((row) =>
          Object.fromEntries(
            requiredHeaders.map((key) => [
              key,
              (row as Record<string, any>)[key] ?? "",
            ]),
          ),
        )
      : (rows as Record<string, any>[]);

    const csv = Papa.unparse(filteredRows, {
      quotes: false,
      header: true,
      skipEmptyLines: true,
    });
    const bom = "\uFEFF";

    const blob = new Blob([bom, csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const finalFilteredData = useMemo(() => {
    if (!hasPreview) return tableData;
    if (activeStatusFilter.length === 0) return [];

    return tableData.filter((row: any) =>
      activeStatusFilter.includes(row?.status),
    );
  }, [tableData, activeStatusFilter, hasPreview]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={() => {
          onOpenChange(false);
          setOverwrite(false);
        }}
      >
        <DialogContent className="w-full max-w-full sm:max-w-6xl !gap-0 min-h-[90vh] max-h-[90vh] p-4 flex flex-col [&_[data-slot='dialog-close']]:hidden">
          <DialogHeader className="hidden" />

          {mode === "empty" ? (
            <div className="text-sm text-gray-600">No data available.</div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 overflow-x-auto w-full pt-1">
              <DataTable
                columns={columnsWithStatus}
                data={finalFilteredData}
                heading={dialogTitle}
                enableColumnFilters={true}
                compareKeys={compareKeys as string[]}
                compareKeyMap={compareKeyMap}
                onClose={() => onOpenChange(false)}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-4 pb-1">
            {mode === "preview" && (
              <>
                <div className="text-sm text-gray-700 mr-auto">
                  <span className="font-bold">Note:</span> Please review the CSV
                  data and click Upload.
                </div>

                {previewWithExistingData && (
                  <label className="flex flex-wrap items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={overwrite}
                      disabled={!hasUpdatedRows}
                      onChange={(e) => setOverwrite(e.target.checked)}
                      title={!hasUpdatedRows ? "No updated row(s) found" : ""}
                      className="cursor-pointer disabled:cursor-not-allowed disbled:opacity-50"
                    />
                    Overwrite existing rows
                  </label>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    clearPreview?.();
                    setOverwrite(false);
                    if (!previewWithExistingData) {
                      onOpenChange(false);
                    }
                  }}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="cursor-pointer"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </>
            )}

            {mode === "view" && (
              <div className="flex flex-wrap w-full items-center justify-end gap-4">
                {remoteTestConfig && (isAdmin || isEditor) && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        setRemoteOpen(true);
                        setRemoteLoading(true);
                        setRemoteError(null);

                        const response =
                          await remoteTestConfig.fetcher(resourceId);

                        const rows =
                          remoteTestConfig.mapResponseToRows(response);

                        setRemoteRows(Array.isArray(rows) ? rows : []);
                        setRemoteSummary(
                          remoteTestConfig.summaryBuilder?.(response, rows),
                        );
                      } catch (err: any) {
                        const msg = extractErrorMessage(err);
                        setRemoteError(msg);
                        toast.error(msg);
                      } finally {
                        setRemoteLoading(false);
                      }
                    }}
                  >
                    {remoteTestConfig.buttonLabel}
                  </Button>
                )}
                {(isAdmin || isEditor) && (
                  <Button
                    onClick={() => onRequestFilePick?.()}
                    variant="secondary"
                    className="cursor-pointer"
                  >
                    Upload
                  </Button>
                )}

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="cursor-pointer"
                >
                  Download
                </Button>

                {(isAdmin || isEditor) && hasViewData && (
                  <Button
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isUploading}
                    className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Data
                  </Button>
                )}

                <Button
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>
              </div>
            )}

            {mode === "empty" && (
              <Button
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Confirm Delete"
        description={
          <span>
            This will permanently delete all existing rows for{" "}
            <strong>{title}</strong>. Do you want to continue?
          </span>
        }
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
      {remoteTestConfig && (
        <RemoteDataResultDialog
          open={remoteOpen}
          onClose={() => setRemoteOpen(false)}
          title={remoteTestConfig.buttonLabel}
          loading={remoteLoading}
          error={remoteError}
          rows={remoteRows}
          columns={remoteTestConfig.columns}
          summary={remoteSummary}
        />
      )}
    </>
  );
}
