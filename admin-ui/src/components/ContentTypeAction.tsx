import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import UploadOrViewDialog from "@/components/UploadOrViewDialog";
import type { ContentTypeActionProps } from "@/utils/types";
import { findDuplicateKeyGroups } from "@/utils/findDuplicateKeys";
import { DuplicateCsvDialog } from "@/components/DuplicateCSVDialog";

export default function ContentTypeAction<T, E>({
  resource,
  titleBuilder,
  listData,
  isLoading,
  uploadHook,
  updateHook,
  deleteHook,
  requiredHeaders,
  columns,
  normalizeCsvRow = (row: any) => row as T,
  buildCreatePayload,
  buildUpdatePayload,
  contentType,
  compareKeys,
  compareKeyMap,
  identityKey,
  normalizeApiRow = (row: any) => row as E,
  remoteTestConfig,
}: ContentTypeActionProps<T, E>) {
  const { isAdmin, isEditor } = useUserRole();

  const hasAnyData = listData && Array.isArray(listData) && listData.length > 0;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<T[]>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);

  const title = titleBuilder(resource);

  const handleClick = () => {
    if (!hasAnyData) {
      fileInputRef.current?.click();
      return;
    }
    setDialogOpen(true);
  };

  const handleFileSelected = (file?: File | null) => {
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, meta, errors } = results as any;

        if (errors.length > 0) {
          toast.error(`CSV parse error: ${errors[0].message}`);
          return;
        }

        const headers = (meta.fields || Object.keys(data[0] || [])).map(
          (h: string) => h.trim()
        );

        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(", ")}`);
          return;
        }

        // Normalize rows
        const rows = data.map((row: any) => normalizeCsvRow(row));

        const duplicateGroups = findDuplicateKeyGroups(rows, compareKeys);
        if (duplicateGroups.length > 0) {
          setDuplicateGroups(duplicateGroups);
          setDuplicateDialogOpen(true);
          return;
        }

        setPreviewRows(rows);
        setDialogOpen(true);
      },
      error: (err) => toast.error(err.message || "Failed to parse CSV"),
    });
  };

  return (
    <>
      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
      />

      {/* Action Button */}
      <div className="flex items-center justify-center">
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : hasAnyData ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-8 cursor-pointer"
            onClick={handleClick}
            title={
              isAdmin || isEditor
                ? `View or upload ${contentType} data`
                : `View ${contentType} data`
            }
          >
            View data
          </Button>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={!isAdmin && !isEditor}
            className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              (isAdmin || isEditor)
                ? `No ${contentType} data added\nClick to upload CSV file`
                : `Only admin or editor can upload ${contentType} data`
            }
          >
            <Upload className="h-4 w-4 text-gray-700" />
          </button>
        )}
      </div>

      <UploadOrViewDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setPreviewRows([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
          setDialogOpen(o);
        }}
        title={title}
        resourceId={resource.resourceId}
        viewData={listData}
        parsedPreview={previewRows}
        uploadFunc={uploadHook}
        updateFunc={updateHook}
        deleteFunc={deleteHook}
        requiredHeaders={requiredHeaders}
        columns={columns}
        buildCreatePayload={buildCreatePayload}
        buildUpdatePayload={buildUpdatePayload}
        contentType={contentType}
        onRequestFilePick={() => fileInputRef.current?.click()}
        compareKeys={compareKeys}
        compareKeyMap={compareKeyMap}
        identityKey={identityKey}
        normalizeApiRow={normalizeApiRow}
        clearPreview={() => setPreviewRows([])}
        remoteTestConfig={remoteTestConfig}
      />
      <DuplicateCsvDialog
        open={duplicateDialogOpen}
        compareKeys={compareKeys as string[]}
        duplicates={duplicateGroups}
        onClose={() => {
          setDuplicateDialogOpen(false);
          setDuplicateGroups([]);
          fileInputRef.current!.value = "";
        }}
      />
    </>
  );
}
