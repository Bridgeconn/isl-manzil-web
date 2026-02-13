import { useMemo, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Edit, Trash, Info } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/Datatable";
import {
  useCreateLanguage,
  useLanguages,
  useEditLanguage,
  useDeleteLanguage,
} from "@/hooks/useAPI";
import type { Language } from "@/utils/types";
import { extractErrorMessage } from "@/utils/errorUtils";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/DeleteDialog";
import { FormDialog } from "@/components/FormDialog";

const Languages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const filters = searchTerm
    ? { language_code: searchTerm, language_name: searchTerm }
    : undefined;
  const { data, isLoading, error } = useLanguages(filters);
  const [selectedItem, setSelectedItem] = useState<Language | null>(null);
  const createLanguageMutation = useCreateLanguage();
  const editLanguageMutation = useEditLanguage();
  const deleteLanguageMutation = useDeleteLanguage();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | undefined>(undefined);
  const [addformData, setAddFormData] = useState<{
    language_code: string;
    language_name: string;
    metadata?: string;
  }>({
    language_code: "",
    language_name: "",
    metadata: "",
  });
  const [editFormData, setEditFormData] = useState<{
    language_code: string;
    language_name: string;
    metadata?: string;
  }>({
    language_code: "",
    language_name: "",
    metadata: "",
  });

  const languageItems: Language[] = Array.isArray(data?.items)
    ? data.items
    : [];

  const columnHelper = useMemo(() => createColumnHelper<Language>(), []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("language_id", {
        header: "Language ID",
        enableSorting: true,
      }),
      columnHelper.accessor("language_code", {
        header: "Language Code",
        enableSorting: true,
      }),
      columnHelper.accessor("language_name", {
        header: "Language Name",
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
                  <DialogDescription>
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
              <button title="Edit" onClick={() => handleEditDialogOpen(row)}>
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
  ) as ColumnDef<Language>[];

  const handleAdd = async () => {
    setDialogError(undefined);
    if (addformData.language_code == "" || addformData.language_name == "") {
      setDialogError("Language code and name are required.");
      return;
    }
    if (
      !addformData.language_code.trim() ||
      !addformData.language_name.trim() ||
      addformData.language_code.trim().length > 10 ||
      addformData.language_name.trim().length > 50
    )
      return;
    createLanguageMutation.mutate(
      {
        languageCode: addformData.language_code,
        languageName: addformData.language_name,
        metadata: addformData.metadata,
      },
      {
        onSuccess: () => {
          setAddFormData({
            language_code: "",
            language_name: "",
            metadata: "",
          });
          toast.success("Language added successfully!");
          setAddDialogOpen(false);
        },
        onError: (error) => {
          console.log("Language error:", error);
          const errorMessage = extractErrorMessage(error);
          setDialogError(errorMessage);
        },
      }
    );
  };

  const handleEdit = async () => {
    if (!selectedItem) return;

    if (editFormData.language_code == "" || editFormData.language_name == "") {
      setDialogError("Language code and name are required.");
      return;
    }
    setDialogError(undefined);
    editLanguageMutation.mutate(
      {
        language_id: selectedItem.language_id,
        languageCode: editFormData.language_code,
        languageName: editFormData.language_name,
        metadata: editFormData.metadata,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedItem(null);
          setEditFormData({
            language_code: "",
            language_name: "",
            metadata: "",
          });
          toast.success("Language edited successfully!");
        },
        onError: (error) => {
          console.log("Language edit error:", error);
          const errorMessage = extractErrorMessage(error);
          setDialogError(errorMessage);
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    deleteLanguageMutation.mutate(selectedItem.language_id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedItem(null);
        toast.success("Language deleted successfully!");
      },
      onError: (error) => {
        console.log("Language delete error:", error);
        const errorMessage = extractErrorMessage(error);
        toast.error(errorMessage);
      },
    });
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
    setAddFormData({ language_code: "", language_name: "", metadata: "" });
    setDialogError(undefined);
  };

  const handleEditDialogOpen = (item: Language) => {
    setSelectedItem(item);
    setEditFormData({
      language_code: item.language_code,
      language_name: item.language_name,
      metadata:
        typeof item.metadata === "object"
          ? JSON.stringify(item.metadata, null, 2)
          : item.metadata || "",
    });
    setDialogError(undefined);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setEditFormData({
      language_code: "",
      language_name: "",
    });
    setDialogError(undefined);
  };

  const handleDeleteDialogOpen = (item: Language) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full flex-1 bg-white p-6">
      <DataTable
        columns={columns}
        data={languageItems}
        isLoading={isLoading}
        error={error ? extractErrorMessage(error) : null}
        heading="Languages"
        addButton={true}
        onAdd={() => setAddDialogOpen(true)}
        onSearch={(search) => setSearchTerm(search)}
      />
      <FormDialog
        mode="add"
        open={addDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleAddDialogClose();
          else setAddDialogOpen(true);
        }}
        type="language"
        formData={addformData}
        setFormData={setAddFormData}
        error={dialogError}
        onConfirm={handleAdd}
        isLoading={createLanguageMutation.isPending}
        onCancel={handleAddDialogClose}
      />
      <FormDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleEditDialogClose();
          else setEditDialogOpen(true);
        }}
        type="language"
        formData={editFormData}
        setFormData={setEditFormData}
        error={dialogError}
        onConfirm={handleEdit}
        isLoading={editLanguageMutation.isPending}
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
            Are you sure you want to delete language{" "}
            <strong className="text-gray-900">
              {selectedItem?.language_name}
            </strong>
            ? This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteLanguageMutation.isPending}
      />
    </div>
  );
};
export default Languages;
