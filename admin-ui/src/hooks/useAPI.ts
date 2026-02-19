import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLanguages,
  createLanguage,
  editLanguage,
  deleteLanguage,
  fetchVersions,
  fetchLicenses,
  fetchResources,
  addResource,
  editResource,
  createVersion,
  editVersion,
  deleteVersion,
  deleteResource,
  createLicense,
  editLicense,
  deleteLicense,
  getBibleBooks,
  uploadBibleBook,
  updateBibleBook,
  deleteBibleBooks,
  getDictionaries,
  uploadDictionaries,
  updateDictionaries,
  fetchVideos,
  createVideos,
  updateVideos,
  deleteVideos,
  deleteDictionaries,
  getISLBible,
  uploadISLBible,
  updateISLBible,
  deleteISLBibles,
  getLogFile,
  fetchErrorLogs,
  downloadBibleContent,
} from "../utils/api";
import type {
  DictionaryUploadInput,
  ErrorLogQuery,
  ISLBibleList,
  ISLBiblePostPayload,
  ISLBiblePutPayload,
  VideoBulkCreate,
  VideoBulkUpdate,
  BibleBooksListResponse,
} from "@/utils/types";

export const useLanguages = (filters?: {
  language_code?: string;
  language_name?: string;
}) => {
  return useQuery({
    queryKey: ["languages", filters],
    queryFn: () => fetchLanguages({ page: 0, page_size: 50000, ...filters }),
    retry: false,
  });
};

const sortLanguagesByName = (items: any[]) =>
  [...items].sort((a, b) =>
    a.language_name.localeCompare(b.language_name, undefined, {
      sensitivity: "base",
    }),
  );

export const useLanguageSearch = (searchTerm: string) => {
  const enabled = !!searchTerm || searchTerm === "";

  return useQuery({
    queryKey: ["language-search", searchTerm],
    queryFn: () =>
      fetchLanguages({
        page: 0,
        page_size: 100,
        language_name: searchTerm || undefined,
      }),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    select: (data) => ({
      ...data,
      items: sortLanguagesByName(data.items || []),
    }),
  });
};

export const useCreateLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      languageCode: string;
      languageName: string;
      metadata?: string;
    }) => createLanguage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      queryClient.invalidateQueries({ queryKey: ["language-search"] });
    },
  });
};

export const useEditLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      language_id: number;
      languageCode: string;
      languageName: string;
      metadata?: string;
    }) => editLanguage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      queryClient.invalidateQueries({ queryKey: ["language-search"] });
    },
  });
};

export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language_id: number) => deleteLanguage(language_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      queryClient.invalidateQueries({ queryKey: ["language-search"] });
    },
  });
};

export const useLicenses = () => {
  return useQuery({
    queryKey: ["licenses"],
    queryFn: () => fetchLicenses(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useCreateLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { licenseName: string; details: string }) =>
      createLicense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });
};

export const useEditLicense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      license_id: number;
      licenseName: string;
      details: string;
    }) => editLicense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });
};

export const useDeleteLicense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (license_id: number) => deleteLicense(license_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });
};

// ============== Resources ==============
export const useResources = () => {
  return useQuery({
    queryKey: ["resources"],
    queryFn: fetchResources,
    retry: false,
  });
};

export const useAddResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addResource,
    onSuccess: () => {
      // Invalidate resources query to refetch data
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error: any) => {
      console.error("Error adding resource:", error);
    },
  });
};

export const useEditResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editResource,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error, variables) => {
      console.error("[useEditResource] error:", { variables, error });
    },
  });
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error: any) => {
      console.log("Error deleting resources", error);
    },
  });
};

export const useVersions = () => {
  return useQuery({
    queryKey: ["versions"],
    queryFn: async () => {
      const data = await fetchVersions();
      return data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
export const useCreateVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      abbreviation: string;
      metadata: string;
    }) => createVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions"] });
    },
    onError: (error, variables) => {
      console.error("error:", { variables, error });
    },
  });
};

export const useEditVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      version_id: number;
      name: string;
      abbreviation: string;
      metadata: string;
    }) => editVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions"] });
    },
    onError: (error, variables) => {
      console.error("error:", { variables, error });
    },
  });
};
export const useDeleteVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version_id: number) => deleteVersion(version_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions"] });
    },
    onError: (error, variables) => {
      console.error("error:", { variables, error });
    },
  });
};

export const useGetBibleBooks = (resourceId?: number) =>
  useQuery<BibleBooksListResponse[]>({ // ← Explicit array type
    queryKey: ["bible-books", resourceId],
    queryFn: () => getBibleBooks(resourceId),
    enabled: !!resourceId,
  });

export const useUploadBibleBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { resource_id: number; usfm_file: File }) =>
      uploadBibleBook(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bible-books", variables.resource_id],
      });
    },
    onError: (error) => {
      console.error("Error uploading Bible:", error);
    },
  });
};
export const useUpdateBibleBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      bible_book_id: number;
      usfm: File;
      resource_id?: number;
    }) => updateBibleBook(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bible-books", variables.resource_id],
      });
    },
    onError: (error) => {
      console.error("Error updating Bible:", error);
    },
  });
};

export const useDeleteBibleBooks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { resource_id: number; bookCode: string[] }) =>
      deleteBibleBooks(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bible-books", variables.resource_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["bible-content", variables.resource_id],
      });
    },
    onError: (error) => {
      console.error("Error deleting bible books:", error);
    },
  });
};

// dictionaries

export const useListDictionaries = (resource_id?: number) =>
  useQuery({
    queryKey: ["dictionaries", resource_id],
    queryFn: () => getDictionaries(resource_id as number),
    enabled: !!resource_id,
  });

export const useUploadDictionaries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DictionaryUploadInput) => uploadDictionaries(payload),

    onSuccess: (_, variables) => {
      const resourceId = variables.resource_id;
      if (resourceId) {
        queryClient.invalidateQueries({
          queryKey: ["dictionaries", resourceId],
        });
      }
    },

    onError: (error) => {
      console.error("Error uploading dictionaries:", error);
    },
  });
};

export const useUpdateDictionaries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DictionaryUploadInput) => updateDictionaries(payload),

    onSuccess: (_, variables) => {
      const resourceId = variables.resource_id;
      if (resourceId) {
        queryClient.invalidateQueries({
          queryKey: ["dictionaries", resourceId],
        });
      }
    },

    onError: (err) => {
      console.error("Error updating dictionaries:", err);
    },
  });
};

export const useDeleteDictionaries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { resource_id: number; ids: number[] }) =>
      deleteDictionaries(payload.resource_id, payload.ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dictionaries", variables.resource_id],
      });
    },
    onError: (error) => {
      console.error("Error deleting dictionaries:", error);
    },
  });
};

export const useVideos = (resourceId: number) => {
  return useQuery({
    queryKey: ["videos", resourceId],
    queryFn: () => fetchVideos(resourceId),
    enabled: !!resourceId,
  });
};

export const useCreateVideos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VideoBulkCreate) => createVideos(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["videos", variables.resourceId],
      });
    },
    onError: (error) => {
      console.error("Error creating videos:", error);
    },
  });
};

export const useUpdateVideos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VideoBulkUpdate) => updateVideos(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["videos", variables.resourceId],
      });
    },
    onError: (error) => {
      console.error("Error updating videos:", error);
    },
  });
};

export const useDeleteVideos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { resource_id: number; ids: number[] }) =>
      deleteVideos(payload.resource_id, payload.ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["videos", variables.resource_id],
      });
    },
    onError: (error) => {
      console.error("Error deleting videos:", error);
    },
  });
};

// isl-bible
export const useListISLBible = (resource_id?: number) =>
  useQuery<ISLBibleList>({
    queryKey: ["isl-bible", resource_id],
    queryFn: () => {
      if (resource_id == null) {
        return Promise.resolve({ books: {} });
      }
      return getISLBible(resource_id);
    },
    enabled: !!resource_id && typeof resource_id === "number",
  });

export const useUploadISLBible = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ISLBiblePostPayload) => uploadISLBible(payload),

    onSuccess: (_, variables) => {
      if (variables.resourceId) {
        queryClient.invalidateQueries({
          queryKey: ["isl-bible", variables.resourceId],
        });
      }
    },

    onError: (error) => {
      console.error("Error uploading ISL Bible:", error);
    },
  });
};

export const useUpdateISLBible = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ISLBiblePutPayload) => updateISLBible(payload),

    onSuccess: (_, variables) => {
      if (variables.resourceId) {
        queryClient.invalidateQueries({
          queryKey: ["isl-bible", variables.resourceId],
        });
      }
    },

    onError: (err) => {
      console.error("Error updating ISL Bible:", err);
    },
  });
};

export const useDeleteISLBibles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { resource_id: number; ids: number[] }) =>
      deleteISLBibles(payload.resource_id, payload.ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["isl-bible", variables.resource_id],
      });
    },
    onError: (error) => {
      console.error("Error deleting ISL Bible videos:", error);
    },
  });
};

export const useLogFile = (logFileNumber: number) => {
  return useQuery({
    queryKey: ["log-file", logFileNumber],
    queryFn: () => getLogFile(logFileNumber),
    enabled: logFileNumber >= 0 && logFileNumber <= 10,
    refetchOnWindowFocus: false,
  });
};


export const useErrorLogs = (params: ErrorLogQuery) => {
  return useQuery({
    queryKey: ["error-logs", params],
    queryFn: () => fetchErrorLogs(params),
    refetchOnWindowFocus: false,
  });
};
export const useDownloadBibleContent = (resource_id?: number) => {
  return useQuery({
    queryKey: ["bible-content", resource_id],
    queryFn: () => downloadBibleContent(resource_id as number),
    enabled: false,
  });
};