import { useMemo, useState, useCallback } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useVersions, useEditVersion, useDeleteVersion } from "@/hooks/useAPI";

import { Edit, Trash, Info } from "lucide-react";
import { useCreateVersion } from "@/hooks/useAPI";
import { extractErrorMessage } from "@/utils/errorUtils";
import { toast } from "sonner";
import { DataTable } from "@/components/Datatable";
import { FormDialog } from "@/components/FormDialog";
import { DeleteDialog } from "@/components/DeleteDialog";
import type { Version, VersionFormData } from "@/utils/types";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Versions = () => {
  const { data, isLoading, error } = useVersions();
  const allVersions: Version[] = Array.isArray(data) ? data : [];

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [versionFormData, setVersionFormData] = useState<VersionFormData>({
    name: "",
    abbreviation: "",
    metadata: "",
  });
  // const [editing, setEditing] = useState<Version | null>(null);
  const [dialogError, setDialogError] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Version | null>(null);

  const createVersionMutation = useCreateVersion();
  const editMutation = useEditVersion();
  const deleteMutation = useDeleteVersion();

  const handleEditClick = (version: Version) => {
    // setEditing(version);
    setSelectedItem(version);
    setVersionFormData({
      name: version.name,
      abbreviation: version.abbreviation,
      metadata:
        typeof version.metadata === "object"
          ? JSON.stringify(version.metadata, null, 2)
          : version.metadata || "",
    });
    setDialogMode("edit");
    setEditDialogOpen(true);
  };
  console.log("selectedItem", selectedItem);
  const handleSaveClick = () => {
    setDialogError(undefined);
    if (dialogMode === "add") {
      if (versionFormData.name == "" || versionFormData.abbreviation == "") {
        setDialogError("Vesion name and abbreviation are required.");
        return;
      }
      if (
        !versionFormData.name.trim() ||
        !versionFormData.abbreviation.trim() ||
        versionFormData.abbreviation.trim().length > 10 ||
        versionFormData.name.trim().length > 50
      )
        return;
      createVersionMutation.mutate(
        {
          name: versionFormData.name,
          abbreviation: versionFormData.abbreviation,

          metadata: (() => {
            const raw = versionFormData.metadata ?? "";
            try {
              return JSON.stringify(JSON.parse(raw));
            } catch {
              return raw;
            }
          })(),
        },
        {
          onSuccess: () => {
            setVersionFormData({ name: "", abbreviation: "", metadata: "" });
            toast.success("Version added successfully!");
            setAddDialogOpen(false);
          },
          onError: (error) => {
            console.log("Version error:", error);
            const errorMessage = extractErrorMessage(error);
            setDialogError(errorMessage);
          },
        }
      );
    }
    if (dialogMode === "edit" && selectedItem) {
      const cleanedMeta = versionFormData.metadata?.trim() || "";

      editMutation.mutate(
        {
          version_id: selectedItem.version_id,
          name: versionFormData.name,
          abbreviation: versionFormData.abbreviation,
          metadata: cleanedMeta,
        },
        {
          onSuccess: () => {
            setVersionFormData({ name: "", abbreviation: "", metadata: "" });
            // setEditing(null);

            setEditDialogOpen(false);
            toast.success("Version edited successfully!");
          },
          onError: (error) => setDialogError(extractErrorMessage(error)),
        }
      );
    }
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
    setVersionFormData({ name: "", abbreviation: "", metadata: "" });
    setDialogError(undefined);
  };
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setVersionFormData({
      name: "",
      abbreviation: "",
    });
    setDialogError(undefined);
  };

  const handleDeleteDialogOpen = useCallback((item: Version) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    deleteMutation.mutate(selectedItem.version_id, {
      onSuccess: () => {
        toast.success("Version deleted successfully!");
        setDeleteDialogOpen(false);
        setSelectedItem(null);
      },
      onError: (error) => {
        toast.error(extractErrorMessage(error));
      },
    });
  }, [selectedItem, deleteMutation]);

  const columnHelper = useMemo(() => createColumnHelper<Version>(), []);
  const columns = useMemo(
    () => [
      columnHelper.accessor("version_id", {
        header: "Version ID",
        enableSorting: true,
      }),

      columnHelper.accessor("name", {
        header: "Version Name",
        enableSorting: true,
      }),
      columnHelper.accessor("abbreviation", {
        header: "Abbreviation",
        enableSorting: true,
      }),
      columnHelper.accessor("metadata", {
        header: "Metadata",
        cell: (info) =>
          info.getValue() ? (
            <div className="flex justify-center items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-1">
                    <Info className="h-5 w-5 text-gray-500 cursor-pointer" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Metadata Details</DialogTitle>
                  </DialogHeader>
                  <DialogDescription asChild>
                    <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded overflow-auto max-h-96">
                      {JSON.stringify(info.getValue(), null, 2)}
                    </pre>
                  </DialogDescription>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <span className="text-gray-500">-</span>
          ),
      }),

      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center justify-center gap-4">
              <button title="Edit" onClick={() => handleEditClick(row)}>
                <Edit className="h-4 w-4" />
              </button>
              <button
                title="Delete"
                onClick={() => handleDeleteDialogOpen(row)}
              >
                <Trash className="h-4 w-4 text-red-500 hover:text-red-700 cursor-pointer" />
              </button>
            </div>
          );
        },
      }),
    ],
    []
  ) as ColumnDef<Version>[];

  return (
    <div className="flex flex-col h-full flex-1 bg-white p-6">
      <DataTable
        columns={columns}
        data={allVersions}
        isLoading={isLoading}
        error={error ? extractErrorMessage(error) : null}
        heading="Versions"
        addButton={true}
        onAdd={() => setAddDialogOpen(true)}
      />

      <FormDialog
        mode="add"
        open={addDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleAddDialogClose();
          else setAddDialogOpen(true);
        }}
        type="version"
        formData={versionFormData}
        setFormData={setVersionFormData}
        error={dialogError}
        onConfirm={handleSaveClick}
        isLoading={createVersionMutation.isPending}
        onCancel={handleAddDialogClose}
      />
      <FormDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleEditDialogClose();
          else setEditDialogOpen(true);
        }}
        type="version"
        formData={versionFormData}
        setFormData={setVersionFormData}
        error={dialogError}
        onConfirm={handleSaveClick}
        isLoading={editMutation.isPending}
        onCancel={handleEditDialogClose}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedItem(null);
        }}
        description={
          <>
            Are you sure you want to delete Version{" "}
            <strong className="text-gray-900">{selectedItem?.name}</strong>?
            This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Versions;
