import { useState, useMemo, useCallback } from "react";
import { Edit, Trash, Info, Upload, LoaderCircle, CloudUpload } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/Datatable";
import type {
  Resource,
  ResourceFormData,
  EditResourceInput,
} from "@/utils/types";
import {
  useResources,
  useEditResource,
  useDeleteResource,
  useGetBibleBooks,

} from "@/hooks/useAPI";
import { useUserRole } from "@/hooks/useUserRole";
import AddResourceDialog from "@/components/AddResourceDialog";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/errorUtils";
import { BibleBookSelector } from "@/components/BibleSelector";
//import { AudioBible } from "@/components/AudioBible";
import MetadataDialog from "@/components/MetadataDialog";
import FinalDeleteConfirmDialog from "@/components/FinalDeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { PublishDialog } from "@/components/PublishDialog";

// Table row type
interface BibleRow {
  resourceId: number;
  versionName: string;
  versionAbbreviation: string;
  languageName: string;
  languageId: number;
  licenseName: string;
  licenseId: number;
  revision: string | null;
  metadata: Record<string, any> | null;
  createdTime: string;
  fullResource: Resource;
}

/** Adaptive Text (books) action */
function BibleTextAction({ resource }: { resource: Resource }) {
  const resourceId = resource.resourceId;
  const { data, isLoading } = useGetBibleBooks(resourceId);
  const hasAnyBooks = (data?.books ?? []).length > 0;
  const { isAdmin, isEditor } = useUserRole();

  const [open, setOpen] = useState(false);
  const title = `${resource.language.name
    }_${resource.version.code.toUpperCase()}_${resource.revision ?? ""
    }_Bible Books`;

  return (
    <>
      <div className="flex items-center justify-center">
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : hasAnyBooks ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 cursor-pointer"
            onClick={() => setOpen(true)}
          >
            View data
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => (isAdmin || isEditor) && setOpen(true)}
            disabled={!isAdmin && !isEditor}
            className={`
              p-1 
              transition 
              ${isAdmin || isEditor ? "hover:opacity-80 cursor-pointer" : ""}
              disabled:opacity-50 
              disabled:cursor-not-allowed
            `}
            title={
              isAdmin || isEditor
                ? "No text bible data added\nClick to upload USFM/SFM files"
                : "Only admin or editor can upload USFM/SFM files"
            }
          >
            <Upload className="h-4 w-4 text-gray-700" />
          </button>
        )}
      </div>

      <BibleBookSelector
        isOpen={open}
        onClose={() => setOpen(false)}
        resourceId={resourceId}
        resourceTitle={title}
        openFileInsteadOfDialog={!hasAnyBooks}
      />
    </>
  );
}

/** Adaptive Audio action */
// function BibleAudioAction({ resource }: { resource: Resource }) {
//   const resourceId = resource.resourceId;
//   const { data, isLoading } = useGetAudioBible(resourceId);
//   const { isAdmin, isEditor } = useUserRole();
//   const bundle =
//     Array.isArray(data) && data.find?.((r: any) => r.resourceId === resourceId);
//   const hasAnyAudio =
//     !!bundle && bundle.books && Object.keys(bundle.books).length > 0;

//   const [open, setOpen] = useState(false);
//   const title = `${resource.language.name
//     }_${resource.version.code.toUpperCase()}_${resource.revision ?? ""
//     }_Audio_Bible`;

//   return (
//     <>
//       <div className="flex items-center justify-center">
//         {isLoading ? (
//           <LoaderCircle className="h-4 w-4 animate-spin" />
//         ) : hasAnyAudio ? (
//           <Button
//             type="button"
//             variant="secondary"
//             size="sm"
//             className="h-8 cursor-pointer"
//             onClick={() => setOpen(true)}
//           >
//             View data
//           </Button>
//         ) : (
//           <button
//             type="button"
//             onClick={() => (isAdmin || isEditor) && setOpen(true)}
//             disabled={!isAdmin && !isEditor}
//             className={`
//               p-1 
//               transition 
//               ${isAdmin || isEditor ? "hover:opacity-80 cursor-pointer" : ""}
//               disabled:opacity-50 
//               disabled:cursor-not-allowed
//             `}
//             title={
//               isAdmin || isEditor
//                 ? "No audio bible data added\nClick to upload CSV"
//                 : "Only admin or editor can upload audio files"
//             }
//           >
//             <Upload className="h-4 w-4 text-gray-700" />
//           </button>
//         )}
//       </div>

//       <AudioBible
//         isOpen={open}
//         onClose={() => setOpen(false)}
//         resourceId={resourceId}
//         resourceTitle={title}
//         openFileInsteadOfDialog={!hasAnyAudio}
//       />
//     </>
//   );
// }

function usePublishState(resource: Resource | null) {
  const resourceId = resource?.resourceId ?? 0

  const { data: bookData, isLoading: bookLoading } =
    useGetBibleBooks(resourceId)

//   const { data: audioData, isLoading: audioLoading } =
//     useGetAudioBible(resourceId)

  const hasText = !!resource && (bookData?.books ?? []).length > 0

//   const audioBundle =
//     !!resource &&
//     Array.isArray(audioData) &&
//     audioData.find((r: any) => r.resourceId === resourceId)

//   const hasAudio =
//     !!resource &&
//     !!audioBundle &&
//     audioBundle.books &&
//     Object.keys(audioBundle.books).length > 0

return {
    isLoading: !!resource && bookLoading,
    hasAnyData: !!resource && hasText,
    isPublished: resource?.published === true,
  }
  
}

function PublishAction({
  resource,
  onClick,
}: {
  resource: Resource
  onClick: (resource: Resource) => void
}) {
  const { isLoading, hasAnyData, isPublished } = usePublishState(resource)

  const disabled = !hasAnyData || isLoading

  const title = !hasAnyData
    ? "Upload data before publishing"
    : isPublished
      ? "Unpublish"
      : "Publish"

  const colorClass = !hasAnyData
    ? "text-gray-400"
    : isPublished
      ? "text-green-600"
      : "text-black"

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(resource)}
      title={title}
      className={`
        transition
        ${disabled ? "cursor-not-allowed" : "hover:opacity-80"}
      `}
    >
      <CloudUpload className={`h-4 w-4 ${colorClass}`} />
    </button>
  )
}

const Bibles = () => {
  const { data, isLoading, error } = useResources();
  const { isAdmin, isEditor } = useUserRole();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [selectedMetadataResource, setSelectedMetadataResource] =
    useState<Resource | null>(null);

  const editResourceMutate = useEditResource();
  const deleteResourceMutate = useDeleteResource();

  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);
  const [requiredName, setRequiredName] = useState("");
  const [requiredPhrase, setRequiredPhrase] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [publishOpen, setPublishOpen] = useState(false)
  const [publishStep, setPublishStep] = useState<"confirm" | "loading" | "success">("confirm");


  const handleEditClick = useCallback((resource: Resource) => {
    setSelectedResource(resource);
    setEditDialogOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setSelectedResource(null);
    setEditDialogOpen(false);
  }, []);

  const handleEditSubmit = async (formData: Partial<ResourceFormData>) => {
    if (!selectedResource) return;
    try {
      const parsedMetadata =
        formData.metadata && formData.metadata.trim()
          ? JSON.parse(formData.metadata)
          : {};

      const { metadata: _, ...rest } = formData;
      await editResourceMutate.mutateAsync({
        resourceId: selectedResource.resourceId,
        metadata: parsedMetadata,
        published: selectedResource.published,
        ...rest,
      });
      setEditDialogOpen(false);
      setSelectedResource(null);
      toast.success("Resource updated successfully");
    } catch (error) {
      console.error("Error editing resource:", error);
      throw error;
    }
  };

  const handleDeleteDialogOpen = (resource: Resource) => {
    setSelectedResource(resource);
    const confirmName = `${resource.language.name
      }_${resource.version.code.toUpperCase()}_${resource.revision}_Bible`;
    const confirmPhrase = "delete bible";
    setRequiredName(confirmName);
    setRequiredPhrase(confirmPhrase);
    setFinalConfirmOpen(true);
    setDeleteError(null);
  };

  const handleFinalConfirm = async () => {
    if (!selectedResource) return;
    try {
      const response = await deleteResourceMutate.mutateAsync(
        selectedResource.resourceId
      );
      const deletedIds = response?.deletedIds ?? [];
      const errors = response?.errors ?? [];
      const wasDeleted = deletedIds.includes(selectedResource.resourceId);
      if (wasDeleted) {
        toast.success("Bible deleted successfully");
        setFinalConfirmOpen(false);
        setDeleteError(null);
      } else {
        const msg =
          errors?.[0] ?? response?.message ?? "Failed to delete bible resource";

        setDeleteError(msg);
      }
    } catch (err: any) {
      setDeleteError(extractErrorMessage(err));
    }
  };

  const handleMetadataClick = (resource: Resource) => {
    if (!resource.metadata) resource.metadata = {};
    setSelectedMetadataResource(resource);
  };

  const handlePublishDialogOpen = (resource: Resource) => {
    setSelectedResource(resource);
    setPublishStep("confirm");
    setPublishOpen(true);
  };

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));


  const handlePublish = async () => {
    if (!selectedResource) return;

    setPublishStep("loading");

    try {
      await Promise.all([
        editResourceMutate.mutateAsync({
          resourceId: selectedResource.resourceId,
          published: !selectedResource.published,
        }),
        wait(2000)
      ]);

      setPublishStep("success");
    } catch (error) {
      toast.error(extractErrorMessage(error));
      setPublishStep("confirm");
    }
  };




  // Prepare initial edit data for AddResourceDialog
  const initialEditData = useMemo(() => {
    if (!selectedResource) return undefined;
    return {
      version_id: selectedResource.version.id,
      revision: selectedResource.revision ?? "",
      language_id: selectedResource.language.id,
      language_name: selectedResource.language.name,
      license_id: selectedResource.license.id,
      metadata:
        selectedResource.metadata &&
          typeof selectedResource.metadata === "object" &&
          Object.keys(selectedResource.metadata).length > 0
          ? JSON.stringify(selectedResource.metadata, null, 2)
          : "",
      content_type: selectedResource.content?.contentType ?? "bible",
    } as Partial<ResourceFormData>;
  }, [selectedResource]);

  // Prepare table rows
  const bibleItems: BibleRow[] = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.flatMap((langObj) =>
      langObj.versions
        .filter((v: any) => v.content.contentType.toLowerCase() === "bible")
        .map((v: any) => ({
          resourceId: v.resourceId,
          versionName: v.version.name,
          versionAbbreviation: v.version.code.toUpperCase(),
          languageName: langObj.language.name,
          languageId: langObj.language.id,
          licenseName: v.license.name,
          licenseId: v.license.id,
          revision: v.revision,
          metadata: (() => {
            if (typeof v.metadata === "string") {
              try {
                return JSON.parse(v.metadata);
              } catch {
                return {};
              }
            }
            return v.metadata && typeof v.metadata === "object"
              ? v.metadata
              : {};
          })(),
          createdTime: v.createdTime,
          fullResource: {
            ...v,
            language: langObj.language,
            version: v.version,
            license: v.license,
          },
        }))
    );
  }, [data]);

  // Table columns
  const columnHelper = createColumnHelper<BibleRow>();
  const columns: ColumnDef<BibleRow>[] = useMemo(
    () => [
      columnHelper.accessor("versionAbbreviation", {
        header: "Version",
        enableSorting: true,
      }),
      columnHelper.accessor("languageName", {
        header: "Language",
        enableSorting: true,
      }),
      columnHelper.accessor("licenseName", {
        header: "License",
        enableSorting: true,
      }),
      columnHelper.accessor("revision", {
        header: "Revision",
        enableSorting: true,
      }),
      columnHelper.accessor("metadata", {
        header: "Metadata",
        cell: ({ row }) => {
          const metadata = row.original.metadata;
          const hasMetadata =
            metadata &&
            typeof metadata === "object" &&
            Object.keys(metadata).length > 0;

          return (
            <div className="flex justify-center">
              <div
                onClick={() => {
                  if (hasMetadata) {
                    return handleMetadataClick(row.original.fullResource);
                  }
                  if (isAdmin) {
                    return handleMetadataClick(row.original.fullResource);
                  }
                }}
                title={
                  hasMetadata
                    ? "View metadata"
                    : isAdmin
                      ? "Add metadata"
                      : "Only admins can add metadata"
                }
                className={
                  !hasMetadata && !isAdmin
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }
              >
                {hasMetadata ? (
                  <Info className="h-5 w-5 text-gray-500" />
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!isAdmin}
                    className={
                      !isAdmin
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "audio",
        header: "Audio",
        // cell: ({ row }) => (
        //  // <BibleAudioAction resource={row.original.fullResource} />
        // ),
      }),

      columnHelper.display({
        id: "books",
        header: "Text",
        cell: ({ row }) => (
          <BibleTextAction resource={row.original.fullResource} />
        ),
      }),
      ...(isAdmin
        ? [
          columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (

              <div className="flex items-center justify-center gap-4">
                <PublishAction
                  resource={row.original.fullResource}
                  onClick={handlePublishDialogOpen}
                />

                <button
                  type="button"
                  onClick={() => handleEditClick(row.original.fullResource)}
                  title="Edit"
                  className="hover:opacity-80"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteDialogOpen(row.original.fullResource)
                  }
                  title="Delete"
                  className="hover:opacity-80"
                >
                  <Trash className="h-4 w-4 text-red-500 hover:text-red-700" />
                </button>
              </div>
            ),
          }),
        ]
        : []),
    ],
    [data, isAdmin, isEditor]
  ) as ColumnDef<BibleRow>[];

  return (
    <div className="flex flex-col h-full flex-1 bg-white p-6">
      <DataTable
        columns={columns}
        data={bibleItems}
        isLoading={isLoading}
        error={error ? extractErrorMessage(error) : null}
        heading="Bibles"
      />

      {/* Edit Resource Dialog */}
      {editDialogOpen && selectedResource && (
        <AddResourceDialog
          isOpen={editDialogOpen}
          onClose={handleEditClose}
          onSubmit={handleEditSubmit}
          mode="edit"
          initialData={initialEditData}
        />
      )}

      {selectedMetadataResource && (
        <MetadataDialog
          resource={selectedMetadataResource}
          open={!!selectedMetadataResource}
          onOpenChange={(isOpen) =>
            !isOpen && setSelectedMetadataResource(null)
          }
          mutate={async (data: EditResourceInput) => {
            await editResourceMutate.mutateAsync(data);
            toast.success("Metadata updated successfully");
          }}
        />
      )}
      <FinalDeleteConfirmDialog
        open={finalConfirmOpen}
        onOpenChange={setFinalConfirmOpen}
        requiredName={requiredName}
        requiredPhrase={requiredPhrase}
        onConfirm={handleFinalConfirm}
        loading={deleteResourceMutate.isPending}
        errorText={deleteError}
        onClearError={() => setDeleteError(null)}
        title="Delete Bible"
        subtitle="Type the following to confirm."
        dangerButtonText="Delete Bible"
        cancelButtonText="Cancel"
      />
      {publishOpen && selectedResource && (
        <PublishDialog
          open={publishOpen}
          onOpenChange={setPublishOpen}
          step={publishStep}
          resourceName={`${selectedResource.language.name} ${selectedResource.version.code.toUpperCase()} ${selectedResource.revision} Bible`}
          action={selectedResource.published}
          contentType="Bible"
          onConfirm={handlePublish}
          onClose={() => {
            setPublishOpen(false);
            setSelectedResource(null);
            setPublishStep("confirm");
          }}
        />
      )}

    </div>
  );
};

export default Bibles;
