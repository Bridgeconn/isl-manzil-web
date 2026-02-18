import { useState, useMemo } from "react";
import { Edit, Trash, Info, CheckCircle, XCircle, CloudUpload } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/Datatable";
import type {
  EditResourceInput,
  Resource,
  ResourceFormData,
} from "@/utils/types";
import {
  useResources,
  useEditResource,
  useDeleteResource,
  useUploadISLBible,
  useListISLBible,
  useUpdateISLBible,
  useDeleteISLBibles,
} from "@/hooks/useAPI";
import { useUserRole } from "@/hooks/useUserRole";
import { extractErrorMessage } from "@/utils/errorUtils";
import MetadataDialog from "@/components/MetadataDialog";
import AddResourceDialog from "@/components/AddResourceDialog";
import FinalDeleteConfirmDialog from "@/components/FinalDeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { DetailsDialog } from "@/components/DetailsDialog";
import ContentTypeAction from "@/components/ContentTypeAction";
import { API } from "@/utils/axios";
import { PublishDialog } from "@/components/PublishDialog";

// Table row type
interface ISLRow {
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

// get from isl-bible csv file
interface ISLBibleDialogRow {
  book: string;
  chapter: number;
  title: string;
  description: string;
  url: string;
}

const ISLBibleAction = ({ resource }: { resource: Resource }) => {
  const { data: listData, isLoading } = useListISLBible(resource.resourceId);
  const existingRows = useMemo(() => {
    if (!listData?.books) return [];

    const rows: (ISLBibleDialogRow & { video_id: number })[] = [];

    Object.entries(listData.books).forEach(([bookCode, videos]) => {
      if (!Array.isArray(videos)) return; // safety guard

      videos.forEach((v) => {
        rows.push({
          book: bookCode,
          chapter: v.chapter,
          title: v.title,
          description: v.description,
          url: v.url,
          video_id: v.video_id,
        });
      });
    });

    return rows;
  }, [listData]);

  const REQUIRED_HEADERS = ["book", "chapter", "title", "description", "url"];

  const dialogColumns: ColumnDef<ISLBibleDialogRow>[] = useMemo(() => {
    const helper = createColumnHelper<ISLBibleDialogRow>();
    return [
      helper.accessor("book", { header: "Book" }),
      helper.accessor("chapter", { header: "Chapter" }),
      helper.accessor("title", { header: "Title" }),
      helper.accessor("description", {
        header: "Description",
        enableSorting: false,
        cell: ({ row }) => (
          <DetailsDialog
            text={row.original.description}
            limit={40}
            title="Description"
          />
        ),
      }),
      helper.accessor("url", { header: "URL" }),
    ];
  }, []) as ColumnDef<ISLBibleDialogRow>[];

  const titleBuilder = (r: Resource) =>
    `${r.language.name}_${r.version.code.toUpperCase()}_${r.revision ?? ""
      }_ISL_Bible`
      .replace(/_+/g, " ")
      .trim();

  // create
  const buildCreatePayload = (
    rows: (ISLBibleDialogRow & { video_id?: number })[],
    resourceId: number
  ) => ({
    resourceId: resourceId,
    videos: rows.map((r) => ({
      book: r.book,
      chapter: r.chapter,
      title: r.title,
      description: r.description,
      url: r.url,
    })),
  });

  // update
  const buildUpdatePayload = (
    rows: (ISLBibleDialogRow & { video_id?: number })[],
    resourceId: number
  ) => ({
    resourceId: resourceId,
    videos: rows.map((r) => ({
      id: r.video_id,
      book: r.book,
      chapter: r.chapter,
      title: r.title,
      description: r.description,
      url: r.url,
    })),
  });

  const remoteTestConfig = {
    buttonLabel: "Check remote data",
    fetcher: async (id: number) =>
      API.get(`/isl-bible/test/${id}`).then((r) => r.data),
    mapResponseToRows: (resp: any) => resp.isl_videos ?? [],
    columns: [
      {
        key: "islvideoId",
        header: "ID",
        align: "center",
      },
      {
        key: "book",
        header: "Book",
        align: "center",
      },
      {
        key: "chapter",
        header: "Chapter",
        align: "center",
      },
      {
        key: "url",
        header: "URL",
      },
      {
        key: "public",
        header: "Status",
        align: "center",
        render: (v: boolean) =>
          v ? (
            <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 mx-auto" />
          ),
      },
    ],

    summaryBuilder: (resp: any) => {
      const pub = resp.isl_videos_public ?? 0;
      const total = resp.isl_videos_found ?? 0;

      const percent = total === 0 ? 0 : ((pub / total) * 100).toFixed(2);

      return (
        <div className="text-sm font-semibold">
          Videos public: {pub}/{total} ({percent}%)
        </div>
      );
    },
  };

  return (
    <ContentTypeAction<ISLBibleDialogRow, any>
      resource={resource}
      titleBuilder={titleBuilder}
      listData={existingRows}
      isLoading={isLoading}
      uploadHook={useUploadISLBible}
      updateHook={useUpdateISLBible}
      deleteHook={useDeleteISLBibles}
      requiredHeaders={REQUIRED_HEADERS}
      columns={dialogColumns}
      compareKeys={["book", "chapter"]}
      identityKey="video_id"
      normalizeApiRow={(r) => ({
        video_id: r.video_id,
        book: r.book,
        chapter: r.chapter,
        title: r.title,
        description: r.description,
        url: r.url,
      })}
      buildCreatePayload={buildCreatePayload}
      buildUpdatePayload={buildUpdatePayload}
      contentType="ISL Bible"
      remoteTestConfig={remoteTestConfig}
    />
  );
}

function useISLPublishState(resource?: Resource) {
  const { data, isLoading } = useListISLBible(resource?.resourceId)

  const hasAnyData =
    !!data?.books &&
    Object.values(data.books).some(
      (videos) => Array.isArray(videos) && videos.length > 0
    )

  return {
    isLoading,
    hasAnyData,
    isPublished: resource?.published === true
  }
}


function ISLPublishAction({
  resource,
  onClick
}: {
  resource: Resource,
  onClick: (resource: Resource) => void
}) {
  const { isLoading, hasAnyData, isPublished } = useISLPublishState(resource)

  const disabled = !hasAnyData || isLoading

  const title = !hasAnyData
    ? "Upload isl data before publishing"
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
      className={`transition ${disabled ? "cursor-not-allowed" : "hover:opacity-80"
        }`}
    >
      <CloudUpload className={`h-4 w-4 ${colorClass}`} />
    </button>
  )
}

const ISL = () => {
  const { data, isLoading, error } = useResources();
  const { isAdmin, isEditor } = useUserRole();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [selectedMetadataResource, setSelectedMetadataResource] =
    useState<Resource | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false)

  const [publishStep, setPublishStep] = useState<"confirm" | "loading" | "success">("confirm");

  const editResourceMutate = useEditResource();

  const deleteResourceMutation = useDeleteResource();

  const isDeleting = deleteResourceMutation.isPending;


  const requiredName = selectedResource
    ? `${selectedResource.language.name
      }_${selectedResource.version.code.toUpperCase()}_${selectedResource.revision ?? ""
      }_ISL_Bible`.trim()
    : "";
  const requiredPhrase = "delete isl bible";

  const handleMetadataClick = (resource: Resource) => {
    if (!resource.metadata) resource.metadata = {};
    setSelectedMetadataResource(resource);
  };

  const initialData = useMemo(() => {
    if (!selectedResource) return {};
    return {
      version_id: selectedResource.version.id,
      revision: selectedResource.revision,
      content_type: selectedResource.content?.contentType ?? "isl_bible",
      language_id: selectedResource.language.id,
      language_name: selectedResource.language.name,
      license_id: selectedResource.license.id,
      metadata:
        selectedResource.metadata &&
          typeof selectedResource.metadata === "object" &&
          Object.keys(selectedResource.metadata).length > 0
          ? JSON.stringify(selectedResource.metadata, null, 2)
          : "",
    } as Partial<ResourceFormData>;
  }, [selectedResource]);

  const handleEditClick = (resource: Resource) => {
    setSelectedResource(resource);
    setEditDialogOpen(true);
  };
  const handleEditClose = () => {
    setSelectedResource(null);
    setEditDialogOpen(false);
  };

  const handleEditSubmit = async (formData: any) => {
    console.log("formData", formData);
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

  const handleDeleteClick = (resource: Resource) => {
    setDeleteError(null);
    setSelectedResource(resource);
    setFinalConfirmOpen(true);
  };

  const handleFinalConfirm = async () => {
    if (!selectedResource) return;
    try {
      const response = await deleteResourceMutation.mutateAsync(
        selectedResource.resourceId
      );
      const deletedIds = response?.deletedIds ?? [];
      const errors = response?.errors ?? [];
      const wasDeleted = deletedIds.includes(selectedResource.resourceId);
      if (wasDeleted) {
        toast.success("ISL Bible deleted successfully");
        setFinalConfirmOpen(false);
        setDeleteError(null);
      } else {
        const msg =
          errors?.[0] ??
          response?.message ??
          "Failed to delete ISL bible resource";

        setDeleteError(msg);
      }
    } catch (err: any) {
      setDeleteError(extractErrorMessage(err));
    }
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



  const islItems: ISLRow[] = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.flatMap((langObj) =>
      langObj.versions
        .filter((v: any) => v.content.contentType.toLowerCase() === "isl_bible")
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

  const columnHelper = createColumnHelper<ISLRow>();
  const columns: ColumnDef<ISLRow>[] = useMemo(
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
        id: "data",
        header: "Data",
        cell: ({ row }) => (
          <ISLBibleAction resource={row.original.fullResource} />
        ),
      }),
      ...(isAdmin
        ? [
          columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
              <div className="flex items-center justify-center gap-4">
                <ISLPublishAction
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
                  onClick={() => handleDeleteClick(row.original.fullResource)}
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
  ) as ColumnDef<ISLRow>[];

  return (
    <div className="flex flex-col h-full flex-1 bg-white p-6">
      <DataTable
        columns={columns}
        data={islItems}
        isLoading={isLoading}
        error={error ? extractErrorMessage(error) : null}
        heading="ISL Bible"
      />

      {editDialogOpen && selectedResource && (
        <AddResourceDialog
          isOpen={editDialogOpen}
          onClose={handleEditClose}
          onSubmit={handleEditSubmit}
          mode="edit"
          initialData={initialData}
        />
      )}

      {selectedMetadataResource && (
        <MetadataDialog
          resource={selectedMetadataResource}
          open={!!selectedMetadataResource}
          onOpenChange={(isOpen: boolean) =>
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
        loading={isDeleting}
        errorText={deleteError}
        onClearError={() => setDeleteError(null)}
        title="Delete ISL Bible"
        subtitle="Type the following to confirm."
        dangerButtonText="Delete ISL Bible"
        cancelButtonText="Cancel"
      />
      {publishOpen && selectedResource && (
        <PublishDialog
          contentType="ISL Bible"
          open={publishOpen}
          onOpenChange={setPublishOpen}
          step={publishStep}
          resourceName={`${selectedResource.language.name} ${selectedResource.version.code.toUpperCase()} ${selectedResource.revision} ISL`}
          action={selectedResource.published}
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

export default ISL;
