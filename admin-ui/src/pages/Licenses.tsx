import { useMemo, useState } from "react";
import { Edit, Trash } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/Datatable";
import {
  useLicenses,
  useCreateLicense,
  useEditLicense,
  useDeleteLicense,
} from "@/hooks/useAPI";
import type { License } from "@/utils/types";
import { extractErrorMessage } from "@/utils/errorUtils";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/DeleteDialog";
import { FormDialog } from "@/components/FormDialog";
import { DetailsDialog } from "@/components/DetailsDialog";
const Licenses = () => {
  const { data, isLoading, error } = useLicenses();
  const [selectedItem, setSelectedItem] = useState<License | null>(null);
  const createLicenseMutation = useCreateLicense();
  const editLicenseMutation = useEditLicense();
  const deleteLicenseMutation = useDeleteLicense();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | undefined>(undefined);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addformData, setAddFormData] = useState<{
    license_name: string;
    details: string;
  }>({
    license_name: "",
    details: "",
  });
  const [editFormData, setEditFormData] = useState<{
    license_name: string;
    details: string;
  }>({
    license_name: "",
    details: "",
  });

  const license: License[] = Array.isArray(data) ? data : [];

  const columnHelper = useMemo(() => createColumnHelper<License>(), []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("license_id", {
        header: "License ID",
        enableSorting: true,
        meta: { align: "right" },
      }),
      columnHelper.accessor("license_name", {
        header: "License Name",
        enableSorting: true,
        meta: { align: "left" },
      }),
      columnHelper.accessor("details", {
        header: "Details",
        enableSorting: false,
        meta: { align: "left" },
        cell: ({ row, getValue }) => (
          <DetailsDialog
            text={getValue<string | null | undefined>()}
            limit={50}
            title={row.original.license_name}
            justify="start"
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        meta: { align: "center" },
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleEditDialogOpen(row)}>
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => handleDeleteDialogOpen(row)}>
                <Trash className="h-4 w-4 text-red-500 hover:text-red-700 cursor-pointer" />
              </button>
            </div>
          );
        },
      }),
    ],
    []
  ) as ColumnDef<License>[];

  const handleAdd = async () => {
    setDialogError(undefined);
    if (addformData.license_name === "" || addformData.details === "") {
      setDialogError("License name and details are required.");
      return;
    }
    createLicenseMutation.mutate(
      {
        licenseName: addformData.license_name,
        details: addformData.details,
      },
      {
        onSuccess: () => {
          setAddFormData({
            license_name: "",
            details: "",
          });
          toast.success("Licenses added successfully!");
          setAddDialogOpen(false);
        },
        onError: (error) => {
          const errorMessage = extractErrorMessage(error);
          setDialogError(errorMessage);
        },
      }
    );
  };

  const handleEdit = async () => {
    if (!selectedItem) return;

    if (editFormData.license_name == "" || editFormData.details == "") {
      setDialogError("License name and details are required.");
      return;
    }
    setDialogError(undefined);
    editLicenseMutation.mutate(
      {
        license_id: selectedItem.license_id,
        licenseName: editFormData.license_name,
        details: editFormData.details,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedItem(null);
          setEditFormData({
            license_name: "",
            details: "",
          });
          toast.success("License edited successfully!");
        },
        onError: (error) => {
          const errorMessage = extractErrorMessage(error);
          setDialogError(errorMessage);
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    deleteLicenseMutation.mutate(selectedItem.license_id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedItem(null);
        toast.success("License deleted successfully!");
      },
      onError: (error) => {
        toast.error(extractErrorMessage(error));
      },
    });
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
    setAddFormData({ license_name: "", details: "" });
    setDialogError(undefined);
  };

  const handleEditDialogOpen = (item: License) => {
    setSelectedItem(item);
    setEditFormData({
      license_name: item.license_name,
      details: item.details,
    });
    setDialogError(undefined);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setEditFormData({
      license_name: "",
      details: "",
    });
    setDialogError(undefined);
  };

  const handleDeleteDialogOpen = (item: License) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full flex-1 bg-white p-6">
      <DataTable
        columns={columns}
        data={license}
        isLoading={isLoading}
        error={error ? extractErrorMessage(error) : null}
        heading="Licenses"
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
        type="license"
        formData={addformData}
        setFormData={setAddFormData}
        error={dialogError}
        onConfirm={handleAdd}
        isLoading={createLicenseMutation.isPending}
        onCancel={handleAddDialogClose}
      />
      <FormDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleEditDialogClose();
          else setEditDialogOpen(true);
        }}
        type="license"
        formData={editFormData}
        setFormData={setEditFormData}
        error={dialogError}
        onConfirm={handleEdit}
        isLoading={editLicenseMutation.isPending}
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
            Are you sure you want to delete license{" "}
            <strong className="text-gray-900">
              {selectedItem?.license_name}
            </strong>
            ? This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteLicenseMutation.isPending}
      />
    </div>
  );
};
export default Licenses;
