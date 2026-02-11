import type { ColumnDef } from "@tanstack/react-table";

export interface Resource {
  resourceId: number;
  resourceName: string;
  revision: string | null;
  version: {
    id: number;
    name: string;
    code: string;
  };
  content: {
    id: number;
    contentType: string;
  };
  license: {
    id: number;
    name: string;
  };
  language: {
    id: number;
    code: string;
    name: string;
  };
  metadata: Record<string, any> | null;
  published: boolean;
  audioBible?: {
    name: string;
    url: string;
    format: string;
    books: Record<string, any>;
  } | null;
  createdId?: number | null;
  createdBy?: number | null;
  createdTime?: string;
  updatedId?: number | null;
  updatedBy?: number | null;
  updatedTime?: string;
}

export interface ResourceFormData {
  version_id: number;
  revision: string;
  content_type: string;
  language_id: number;
  language_name?: string;
  license_id: number;
  metadata: string;
}

export interface AddResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => Promise<void>;
  mode?: "add" | "edit";
  initialData?: Partial<ResourceFormData>;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export const CONTENT_TYPES: SelectOption[] = [
  { label: "Bible", value: "bible" },
  { label: "Commentary", value: "commentary" },
  { label: "Dictionary", value: "dictionary" },
  { label: "Video", value: "video" },
  { label: "Infographics", value: "infographics" },
  { label: "OBS", value: "obs" },
  { label: "ISL Bible", value: "isl_bible" },
];

export type EditResourceInput = {
  resourceId: number;
  versionId?: number | null;
  revision?: string | null;
  contentType?: string | null;
  languageId?: number | null;
  licenseId?: number | null;
  metadata?: Record<string, any> | null;
  published?: boolean;
};

export type VersionCreate = {
  name: string;
  abbreviation: string;
  metadata?: string | null;
};

export type VersionUpdate = {
  version_id: number;
  name: string;
  abbreviation: string;
  metadata?: string | null;
};

export interface Language {
  language_id: number;
  language_code: string;
  language_name: string;
  metadata: string | null;
}

export interface License {
  license_id: number;
  license_name: string;
  details: string;
}

export type Version = {
  version_id: number;
  name: string;
  abbreviation: string;
  metadata?: string;
};
export type VersionFormData = {
  name: string;
  abbreviation: string;
  metadata?: string;
};

export type BibleBook = {
  bookId: number;
  book: string;
  abbreviation: string;
  chapterCount: number;
};

export type BibleBookResponse = {
  bible_book_id: number;
  book_code: string;
  book_id: number;
  short: string;
  long: string;
  abbr: string;
};

export type BibleBooksListResponse = {
  resource_id: number;
  books: BibleBookResponse[];
};
export interface BibleBookSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: number | null;
  resourceTitle?: string;
  autoOpenUpload?: boolean;
  openFileInsteadOfDialog?: boolean;
}

export interface CommentaryResource {
  resource_id: number;
  revision: string | null;
  meta_data: string | null;
  created_date: string;
  language_id: number;
  language_name: string;
  version_id: number;
  version_name: string;
  version_abbreviation: string;
  license_id: number;
  license_name: string;
}
export type FinalDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearError?: () => void;
  requiredName: string;
  requiredPhrase: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  errorText?: string | null;

  title?: string;
  subtitle?: string;
  dangerButtonText?: string;
  cancelButtonText?: string;
};

export interface AudioBibleProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: number | null;
  resourceTitle?: string;
  openFileInsteadOfDialog?: boolean;
}

export type AudioBibleResponse = {
  resourceId: number;
  name: string;
  url: string;
  books: Record<string, number>;
  format: string;
};

export type AudioBibleListResponse = AudioBibleResponse[];

export interface UploadStatus {
  [fileName: string]: {
    status: "uploading" | "success" | "error";
    bookId?: number;
    bookAbbr?: string;
    error?: string;
  };
}

export interface PendingUpload {
  file: File;
  bookId: number;
  bookAbbr: string;
  bookName: string;
  isExisting: boolean;
  isValid: boolean;
}

export interface InfographicIn {
  resource_id: number;
  book_id: number;
  title: string;
  file_name: string;
}

export interface InfographicOut {
  id: number;
  resource_id: number;
  book_id: number;
  title: string;
  file_name: string;
  image_url?: string | null;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ListInfographicResponse {
  status: string;
  data: InfographicOut[];
  pagination: Pagination;
}

export interface BatchInfographicCreateIn {
  resource_id: number;
  infographics: InfographicIn[];
}

export interface VideoIn {
  book: string;
  chapter?: number | null;
  url: string;
  title: string;
  description?: string | null;
}

export interface VideoInWithId extends VideoIn {
  id: number;
}

export interface VideoBulkCreate {
  resourceId: number;
  videos: VideoIn[];
}

export interface VideoBulkUpdate {
  resourceId: number;
  videos: VideoInWithId[];
}

interface VideoItem {
  video_id: number;
  title: string;
  description?: string | null;
  url: string;
}

export interface VideoGetOut {
  books: Record<string, Record<string, VideoItem[]>>;
}

export type RemoteTestStatus = "present" | "missing" | boolean;

export interface RemoteTestColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface RemoteTestConfig<Row, RawResponse = any> {
  buttonLabel: string;
  fetcher: (resourceId: number) => Promise<RawResponse>;
  mapResponseToRows: (response: RawResponse) => Row[];
  summaryBuilder?: (response: RawResponse, rows: Row[]) => React.ReactNode;
  columns: RemoteTestColumn<Row>[];
}

export interface ContentTypeActionProps<T = any, E = any> {
  resource: Resource;
  titleBuilder: (resource: any) => string;

  listData: E[] | null;
  isLoading: boolean;
  uploadHook: () => any;

  updateHook: () => any;

  deleteHook: () => any;

  requiredHeaders: string[];
  columns: ColumnDef<T>[];

  normalizeCsvRow?: (row: any) => T;

  buildCreatePayload: (rows: T[], resourceId: number) => any;

  buildUpdatePayload: (row: T[], resourceId: number) => any;

  contentType: string;

  compareKeys: (keyof T | string)[];
  compareKeyMap?: Record<string, string>;
  identityKey: string;
  normalizeApiRow?: (row: any) => E;
  remoteTestConfig?: RemoteTestConfig<any>;
}

export interface DuplicateCsvDialogProps {
  open: boolean;
  compareKeys: string[];
  duplicates: { key: string; values: any[] }[];
  onClose: () => void;
}

export interface UploadOrViewDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  resourceId: number;
  viewData?: any;
  parsedPreview?: T[];
  uploadFunc: () => any;
  updateFunc: () => any;
  deleteFunc: () => any;
  requiredHeaders?: string[];
  columns?: ColumnDef<T>[];
  buildCreatePayload: (rows: T[], resourceId: number) => any;
  buildUpdatePayload: (rows: T[], resourceId: number) => any;
  contentType: string;
  onRequestFilePick?: () => void;
  compareKeys: (keyof T | string)[];
  compareKeyMap?: Record<string, string>;
  identityKey: string;
  normalizeApiRow?: (row: any) => any;
  clearPreview?: () => void;
  remoteTestConfig?: RemoteTestConfig<any>;
}

// dictionaries

export interface DictionaryInput {
  keyword: string,
  wordForms: string,
  strongs: string,
  definition: string,
  translationHelp: string,
  seeAlso: string,
  ref: string,
  examples: string
}


export interface DictionaryItem {
  wordId : number,
  keyword: string,
  wordForms: string,
  strongs: string,
  definition: string,
  translationHelp: string,
  seeAlso: string,
  ref: string,
  examples: string,
}


export interface DictionaryList {
  content : DictionaryItem[],
  resourceId : number,
  totalElements: number;
  totalPages: number;
  number: number;     
  size: number;      
}


export interface DictionaryUploadInput {
  resource_id : number,
  dictionary : DictionaryItem[]
}


export interface ISLBibleItem{
  book: string;
  chapter : number;
  title: string;
  description: string;
  url: string;
}

// get isl-bible structure
export interface ISLBibleGetItem {
  video_id: number;
  chapter: number;
  title: string;
  description: string;
  url: string;
}

export type ISLBibleBooksMap = {
  [bookName: string]: ISLBibleGetItem[];
};

export interface ISLBibleList {
  books: ISLBibleBooksMap;
}

export interface ISLBiblePostPayload {
  resourceId: number;
  videos: ISLBibleItem[];
}

export interface ISLBibleVideoPut extends ISLBibleItem {
  id: number;
}

export interface ISLBiblePutPayload {
  resourceId: number;
  videos: ISLBibleVideoPut[];
}


export interface CommentaryGetItem {
  commentary_id: number;
  bookCode: string;
  chapter: number;
  verse: string;
  text: string;
}

export interface CommentaryPostItem {
  book_id: number;
  chapter: number;
  verse: string;
  text: string;
}

export interface CommentaryPutItem extends CommentaryPostItem {
  commentary_id: number;
}

export interface CommentaryList {
  resourceId: number;
  content: CommentaryGetItem[];
}

export interface CommentaryPostPayload {
  resource_id: number;
  commentary: CommentaryPostItem[];
}

export interface CommentaryPutPayload {
  resource_id: number;
  commentary: CommentaryPutItem[];
}

export interface OBSStory {
  id?: number
  story_no: number
  title: string
  text: string
  url?: string
}

export interface OBSViewResponse {
  resource_id: number
  stories: OBSStory[]
}

export type OBSMode = "md" | "isl_csv"


export interface AuditLogQuery {
  page: number;
  page_size: number;
  user_id?: number;
  path?: string;
  status_code?: number;
  date_from?: string;
  date_to?: string;
}

export interface ErrorLogQuery {
  user_id? : number;
  page?: number;
  page_size?: number; 
  start_time? : string;
  end_time? : string;
  limit? : number;
}
export interface BibleBooks {
  bible_book_id: number;
  book_id: number;
  book_code: string;   
  book_name: string;   
  chapters: number;
  content : string;
}

export interface TextBibleContent {
  resource_id : number;
  total_books :  number;
  books : BibleBooks[]
}

export interface ReadingPlanRow {
  month: string;
  date: string;
  reading: string;
}

export type ApiReadingPlan = {
  id: number;
  month: number;
  day: number;
  readings: {
    ref: string;
    text: string;
  }[];
};

export interface VerseOfTheDayRow {
  year: string;
  month: string;
  date: string;
  verse: string;
}

export type ApiVerseOfTheDay = {
  id: string;
  year: number;
  month: number;
  date: number;
  book_code: string;
  chapter: number;
  verse: number;
};

