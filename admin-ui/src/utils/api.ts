import { API } from "./axios";

import {
  type ResourceFormData,
  type EditResourceInput,
  type VersionCreate,
  type VersionUpdate,
  type BibleBooksListResponse,
  type DictionaryUploadInput,
  type VideoBulkUpdate,
  type VideoBulkCreate,
  type ISLBibleList,
  type ISLBiblePostPayload,
  type ISLBiblePutPayload,
  type AuditLogQuery,
  type ErrorLogQuery,
} from "./types";

function normalizeMetadata(
  input?: string | Record<string, any> | null,
): Record<string, any> | null {
  if (typeof input === "string" && input.trim() !== "") {
    return JSON.parse(input);
  } else if (typeof input === "object" && input !== null) {
    return input;
  }
  return null;
}

// ============== Languages ==============
export const fetchLanguages = async (params: {
  page: number;
  page_size: number;
  language_code?: string;
  language_name?: string;
}) => {
  try {
    const res = await API.get("/language", { params });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      return { items: [], total: 0 };
    }
    throw err;
  }
};

export const createLanguage = async (data: {
  languageCode: string;
  languageName: string;
  metadata?: string | Record<string, any>;
}) => {
  const payload = {
    languageCode: data.languageCode,
    languageName: data.languageName,
    metadata: normalizeMetadata(data.metadata),
  };
  const res = await API.post("/language", payload);
  return res.data;
};

export const editLanguage = async (data: {
  language_id: number;
  languageCode: string;
  languageName: string;
  metadata?: string | Record<string, any>;
}) => {
  const payload = {
    languageCode: data.languageCode,
    languageName: data.languageName,
    metadata: normalizeMetadata(data.metadata),
  };
  const res = await API.put(`/language/${data.language_id}`, payload);
  return res.data;
};

export const deleteLanguage = async (language_id: number) => {
  const res = await API.delete(`/languages/bulk-delete`, {
    data: {
      language_ids: [language_id],
    },
  });
  return res.data;
};

// ============== Licenses ==============
export const fetchLicenses = async () => {
  try {
    const res = await API.get("/license");
    return Array.isArray(res.data) ? res.data : [];
  } catch (err: any) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const createLicense = async (data: {
  details: string;
  licenseName: string;
}) => {
  const res = await API.post("/license", data);
  return res.data;
};

export const editLicense = async (data: {
  license_id: number;
  licenseName: string;
  details: string;
}) => {
  const { license_id, licenseName, details } = data;
  const res = await API.put(`/license/${license_id}`, { licenseName, details });
  return res.data;
};

export const deleteLicense = async (license_id: number) => {
  const res = await API.delete(`/license/bulk-delete`, {
    data: { license_ids: [license_id] },
  });
  return res.data;
};

// ============== Resources ==============
export const fetchResources = async () => {
  try {
    const res = await API.get("/resources");
    return Array.isArray(res.data) ? res.data : [];
  } catch (err: any) {
    if (err.response?.status === 404) {
      return [];
    }
    throw err;
  }
};

export const addResource = async (payload: ResourceFormData) => {
  const normalizedPayload = {
    ...payload,
    metadata: normalizeMetadata(payload.metadata),
  };
  const res = await API.post("/resources", normalizedPayload);
  return res.data;
};

export const editResource = async (data: EditResourceInput) => {
  const normalizedPayload = {
    ...data,
    ...(data.metadata && {
      metadata: normalizeMetadata(data.metadata),
    }),
  };
  const res = await API.put("/resources", normalizedPayload);
  return res.data;
};

export const deleteResource = async (resourceId: number) => {
  const res = await API.delete("resources/bulk-delete", {
    data: {
      resource_ids: [resourceId],
    },
  });
  return res.data;
};

// ============== Versions ==============
export const fetchVersions = async () => {
  try {
    const res = await API.get("/versions");
    return Array.isArray(res.data) ? res.data : [];
  } catch (err: any) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const createVersion = async (data: VersionCreate) => {
  const payload = {
    ...data,
    metadata: normalizeMetadata(data.metadata),
  };
  const res = await API.post("/versions", payload);
  return res.data;
};

export const editVersion = async (data: VersionUpdate) => {
  const { version_id, name, abbreviation, metadata } = data;
  const res = await API.put(`/versions/${version_id}`, {
    name,
    abbreviation,
    metadata: normalizeMetadata(metadata),
  });
  return res.data;
};

export const deleteVersion = async (version_id: number) => {
  const res = await API.delete(`/versions/bulk-delete`, {
    data: {
      version_ids: [version_id],
    },
  });
  return res.data;
};

// ============== Bible Books ==============

export const getBibleBooks = async (resourceId?: number) => {
  const res = await API.get<BibleBooksListResponse[]>("/bible/books", { // ← Array type
    params: { resource_id: resourceId },
  });
  return res.data;
};

export const uploadBibleBook = async (data: {
  resource_id: number;
  usfm_file: File;
}) => {
  const formData = new FormData();
  formData.append("usfm", data.usfm_file);
  formData.append("resource_id", data.resource_id.toString());
  const res = await API.post("/bible", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const uploadAudioBible = async (data: {
  resource_id: number;
  name: string;
  base_url: string;
  books: Record<string, number>;
  format: string;
}) => {
  const res = await API.post("/audio-bible", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
};

export const updateBibleBook = async (data: {
  bible_book_id: number;
  usfm: File;
}) => {
  const formData = new FormData();
  formData.append("bible_book_id", data.bible_book_id.toString());
  formData.append("usfm", data.usfm);
  const res = await API.put("/bible", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};


export const deleteBibleBooks = async (data: {
  resource_id: number;
  bookIds: string[];
}) => {
  const { resource_id, bookIds } = data;
  const res = await API.delete(`/bible/${resource_id}/books`, {
    data: { bookIds },
  });
  return res.data;
};

export const fetchVideos = async (resourceId: number) => {
  if (!resourceId) throw new Error("resourceId is required");
  const res = await API.get(`/videos?resource_id=${resourceId}`);
  return res.data;
};

export const createVideos = async (payload: VideoBulkCreate) => {
  const res = await API.post(`/videos`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const updateVideos = async (payload: VideoBulkUpdate) => {
  const res = await API.put(`/videos`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const deleteVideos = async (resource_id: number, video_id: number[]) => {
  const res = await API.delete(`/videos/${resource_id}`, {
    data: { video_id: video_id },
  });
  return res.data;
};

export const getDictionaries = async (resourceId: number) => {
  const res = await API.get(`/dictionary/${resourceId}`);
  return res.data;
};

export const uploadDictionaries = async (payload: DictionaryUploadInput) => {
  const res = await API.post("/dictionary", payload);
  return res.data;
};

export const updateDictionaries = async (payload: any) => {
  const res = await API.put("/dictionary", payload);
  return res.data;
};

export const deleteDictionaries = async (
  resource_id: number,
  wordIds: number[],
) => {
  const res = await API.delete(`/dictionary/${resource_id}/word`, {
    data: { wordIds: wordIds },
  });
  return res.data;
};

export const getISLBible = async (
  resource_id: number,
): Promise<ISLBibleList> => {
  try {
    const res = await API.get<ISLBibleList>(`isl-bible/${resource_id}`);
    const data = res.data ?? ({} as ISLBibleList);
    return {
      books: data.books ?? {},
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      return { books: {} };
    }
    throw err;
  }
};

export const uploadISLBible = async (payload: ISLBiblePostPayload) => {
  const res = await API.post(`isl-bible`, payload);
  return res.data;
};

export const updateISLBible = async (payload: ISLBiblePutPayload) => {
  const res = await API.put(`isl-bible`, payload);
  return res.data;
};

export const deleteISLBibles = async (
  resource_id: number,
  videoIds: number[],
) => {
  const res = await API.delete(`/isl-bible/${resource_id}`, {
    data: { videoIds: videoIds },
  });
  return res.data;
};

export const getLogFile = async (logFileNo: number): Promise<string> => {
  if (logFileNo < 0 || logFileNo > 10) {
    throw new Error("log_file_no must be between 0 and 10");
  }
  const res = await API.get(`/log/${logFileNo}`, {
    responseType: "text",
  });
  return res.data;
};

export const downloadAllLogs = async (): Promise<Blob> => {
  const res = await API.get("/logs", {
    responseType: "blob",
  });
  return res.data;
};

export const fetchAuditLogs = async (params: AuditLogQuery) => {
  const res = await API.get("/audit-logs", { params });
  return res.data;
};

export const fetchErrorLogs = async (params: ErrorLogQuery) => {
  const res = await API.get("error-log", { params });
  return res.data;
};

export const downloadBibleContent = async (resource_id : number) =>{
  const res = await API.get(`/bible/${resource_id}/content/usfm`)
  return res.data
}

