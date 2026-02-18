import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import Papa from "papaparse";
  import {
    AlertCircle,
    CheckCircle,
    Plus,
    XCircle,
    Download,
  } from "lucide-react";
  import { useEffect, useState, useMemo, useRef } from "react";
  import JSZip from "jszip";
  import { saveAs } from "file-saver";
  import {
    useGetBibleBooks,
    useUploadBibleBook,
    useUpdateBibleBook,
    useDeleteBibleBooks,
    useDownloadBibleContent,
  } from "@/hooks/useAPI";
  import type { BibleBook } from "@/utils/types";
  import { Button } from "./ui/button";
  import type {
    BibleBookSelectorProps,
    UploadStatus,
    PendingUpload,
  } from "../utils/types";
  import { useUserRole } from "@/hooks/useUserRole";
  import { extractErrorMessage } from "@/utils/errorUtils";
  import FinalDeleteConfirmDialog from "@/components/FinalDeleteConfirmDialog";
  import { useQueryClient } from "@tanstack/react-query";
  import { toast } from "sonner";
  
  interface DeleteResults {
    success: string[];
    failed: { id: string; reason: string }[];
  }
  
  // --- Upload Confirmation Dialog ---
  const UploadConfirmationDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (overwriteExisting: boolean) => void;
    pendingUploads: PendingUpload[];
  }> = ({ isOpen, onClose, onConfirm, pendingUploads }) => {
    const [overwriteBooks, setOverwriteBooks] = useState(false);
    const validBooks = pendingUploads.filter((u) => u.isValid);
    const invalidBooks = pendingUploads.filter((u) => !u.isValid);
    const existingBooks = validBooks.filter((u) => u.isExisting);
    const totalValidBooks = validBooks.length;
  
    useEffect(() => {
      if (!isOpen) setOverwriteBooks(false);
    }, [isOpen]);
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Upload Books</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            {totalValidBooks > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Books selected ({totalValidBooks})
                </p>
                <div className="flex flex-wrap gap-2">
                  {validBooks.map((upload) => (
                    <div
                      key={upload.bookId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded text-xs font-medium text-blue-700"
                    >
                      <span>{upload.bookAbbr.toUpperCase()}</span>
                      <CheckCircle className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {invalidBooks.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-2">
                  Invalid Books Found ({invalidBooks.length})
                </p>
                <div className="flex flex-col gap-1 text-xs text-red-700">
                  {invalidBooks.map((upload) => (
                    <div
                      key={upload.file.name}
                      className="flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>{upload.file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {existingBooks.length > 0 && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-2">
                  Existing Books ({existingBooks.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingBooks.map((upload) => (
                    <div
                      key={`existing-${upload.bookId}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 border border-orange-200 rounded text-xs font-medium text-orange-700"
                    >
                      <span>{upload.bookAbbr.toUpperCase()}</span>
                      <AlertCircle className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {existingBooks.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={overwriteBooks}
                  onChange={(e) => setOverwriteBooks(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                <label>Overwrite books</label>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onConfirm(overwriteBooks)}>Upload</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  // --- Upload Status Dialog ---
  const UploadStatusDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    uploadStatus: UploadStatus;
    skippedBooks?: string[];
  }> = ({ isOpen, onClose, uploadStatus, skippedBooks = [] }) => {
    const statusEntries = Object.entries(uploadStatus);
    const totalFiles = statusEntries.length;
    const successEntries = statusEntries.filter(
      ([_, s]) => s.status === "success",
    );
    const errorEntries = statusEntries.filter(([_, s]) => s.status === "error");
    const successCount = successEntries.length;
    const uploadingCount = statusEntries.filter(
      ([_, status]) => status.status === "uploading",
    ).length;
    const allFinished = uploadingCount === 0;
    const shouldShowProgressBar = successCount > 0 || uploadingCount > 0;
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Upload Status</DialogTitle>
          </DialogHeader>
  
          <div className="space-y-4">
            {skippedBooks.length > 0 && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-2">
                  Books Skipped ({skippedBooks.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {skippedBooks.map((bookAbbr) => (
                    <div
                      key={bookAbbr}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 border border-orange-200 rounded text-xs font-medium text-orange-700"
                    >
                      <span>{bookAbbr.toUpperCase()}</span>
                      <AlertCircle className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {totalFiles === 0 && skippedBooks.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-600 text-sm">
                All selected books already exist. No new uploads performed.
              </div>
            )}
  
            {totalFiles > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Uploaded ({successCount}/{totalFiles})
                </p>
                <div className="flex flex-wrap gap-2">
                  {successEntries.map(([_, s]) => (
                    <div
                      key={s.bookAbbr}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded text-xs font-medium text-blue-700"
                    >
                      <span>{s.bookAbbr?.toUpperCase()}</span>
                      <CheckCircle className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {errorEntries.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-2">
                  Upload Errors ({errorEntries.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {errorEntries.map(([fileName, s]) => (
                    <div
                      key={fileName}
                      title={s.error}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-200 rounded text-xs font-medium text-red-700"
                    >
                      <span>{fileName}</span>
                      <XCircle className="w-3 h-3 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {allFinished && successCount > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg text-center text-green-700 font-medium">
                {successCount} book{successCount > 1 ? "s" : ""} uploaded
                successfully!
              </div>
            )}
  
            {shouldShowProgressBar && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(successCount / totalFiles) * 100}%`,
                  }}
                />
              </div>
            )}
  
            <div className="flex justify-center pt-2">
              <Button onClick={onClose} disabled={uploadingCount > 0}>
                {uploadingCount > 0 ? "Uploading..." : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  const DeleteStatusDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    results: DeleteResults;
  }> = ({ isOpen, onClose, results }) => {
    const { success, failed } = results;
    const hasSuccess = success.length > 0;
    const hasFailed = failed.length > 0;
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delete Books Status</DialogTitle>
          </DialogHeader>
  
          <div className="space-y-4">
            {hasSuccess && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  ✅ Successfully Deleted ({success.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {success.map((abbr) => (
                    <span
                      key={abbr}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded text-xs font-medium text-blue-700"
                    >
                      {abbr.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
  
            {hasFailed && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-2">
                  ❌ Failed to Delete ({failed.length})
                </p>
                <div className="flex flex-col gap-2">
                  {failed.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-1 bg-red-100 border border-red-200 rounded text-xs font-medium text-red-700"
                    >
                      <span>{item.id.toUpperCase()}</span>
                      <span className="text-[11px] text-red-500 italic">
                        {item.reason.replaceAll("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {!hasSuccess && !hasFailed && (
              <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-600 text-sm">
                No deletions performed.
              </div>
            )}
  
            <div className="flex justify-center pt-2">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  export const BibleBookSelector = ({
    isOpen,
    onClose,
    resourceId,
    resourceTitle,
    openFileInsteadOfDialog,
  }: BibleBookSelectorProps) => {
    const { isAdmin, isEditor } = useUserRole();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: bibleBooksResp } = useGetBibleBooks(resourceId ?? undefined);
    const uploadBible = useUploadBibleBook();
    const updateBibleBook = useUpdateBibleBook();
    const deleteBibleBooks = useDeleteBibleBooks();
    const isDeleting = deleteBibleBooks.isPending;
    const resourceBibles = bibleBooksResp?.books ?? [];
    const hasUploadedBooks = (bibleBooksResp?.books?.length ?? 0) > 0;
  
    const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [skippedBooks, setSkippedBooks] = useState<string[]>([]);
    const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [showDeleteStatusDialog, setShowDeleteStatusDialog] = useState(false);
    const [deleteResults, setDeleteResults] = useState<DeleteResults>({
      success: [],
      failed: [],
    });
  
    const requiredName = resourceTitle
      ? resourceTitle.replace(/\s*Books\s*$/i, "").trim()
      : "";
  
    const requiredPhrase =
      selectedBooks.length > 1 ? "delete bible books" : "delete bible book";
  
    const uploadedBookIds = useMemo(
      () => new Set(resourceBibles.map((b) => b.book_id)),
      [resourceBibles],
    );
  
    const getBibleBookId = (bookId: number) => {
      const book = resourceBibles.find((b: any) => b.book_id === bookId);
      return book ? book.bible_book_id : null;
    };
  
    const handleSelectBook = (abbr: string) => {
      setSelectedBooks((prev) =>
        prev.includes(abbr) ? prev.filter((id) => id !== abbr) : [...prev, abbr],
      );
    };
  
    const handleSelectAll = () => {
      if (selectAll) {
        setSelectedBooks([]);
        setSelectAll(false);
      } else {
        const allUploaded = bibleBooks
          .filter((b) => uploadedBookIds.has(b.bookId))
          .map((b) => b.abbreviation);
        setSelectedBooks(allUploaded);
        setSelectAll(true);
      }
    };
  
    const handleFinalConfirm = async () => {
      setDeleteError(null);
  
      // how many books are currently uploaded (before delete)
      const totalUploadedCount = uploadedBookIds.size;
      const isDeletingAllCurrent = selectedBooks.length === totalUploadedCount;
  
      try {
        const response = await deleteBibleBooks.mutateAsync({
          resource_id: resourceId!,
          bookIds: selectedBooks,
        });
  
        const deletedIds: string[] = response?.deletedIds ?? [];
        const errors: string[] = response?.errors ?? [];
  
        const deletedSet = new Set(deletedIds.map((id) => id.toUpperCase()));
  
        const success = selectedBooks.filter((b) =>
          deletedSet.has(b.toUpperCase()),
        );
        const failed = selectedBooks
          .filter((b) => !deletedSet.has(b.toUpperCase()))
          .map((b) => {
            const errMsg =
              errors?.find((msg) =>
                msg.toLowerCase().includes(b.toLowerCase()),
              ) || "Unknown error";
  
            return { id: b, reason: errMsg };
          });
  
        setDeleteResults({ success, failed });
  
        const allDeletedSuccessfully =
          isDeletingAllCurrent && failed.length === 0 && success.length > 0;
  
        if (allDeletedSuccessfully) {
          onClose();
        }
      } catch (err: any) {
        setDeleteError(extractErrorMessage(err));
        const backendErrors: string[] = err?.response?.data?.errors ?? [];
        const failed = selectedBooks.map((b) => {
          const match =
            backendErrors.find((msg) =>
              msg.toLowerCase().includes(b.toLowerCase()),
            ) || "Request failed";
  
          return { id: b, reason: match };
        });
        setDeleteResults({
          success: [],
          failed,
        });
      } finally {
        setShowDeleteStatusDialog(true);
        setFinalConfirmOpen(false);
        setSelectedBooks([]);
        setSelectAll(false);
      }
    };
  
    const handleUploadClick = () => fileInputRef.current?.click();
  
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
  
      const uploads: PendingUpload[] = [];
  
      for (const [idx, file] of Array.from(files).entries()) {
        const name = file.name.toLowerCase();
  
        // Detecting book from filename
        const match = bibleBooks.find(
          (b) =>
            name.includes(b.abbreviation.toLowerCase()) ||
            name.includes(b.book.toLowerCase()),
        );
  
        let bookId = match?.bookId ?? -1;
        let bookAbbr = match?.abbreviation ?? `INVALID-${idx + 1}`;
        let bookName = match?.book ?? file.name;
        let isValid = Boolean(match);
  
        // Double-check by reading USFM \id
        try {
          const text = await file.text();
          const idMatch = text.match(/\\id\s+([A-Z0-9]{2,4})/i);
          const codeInFile = idMatch?.[1]?.toUpperCase();
  
          if (codeInFile) {
            const matchById = bibleBooks.find(
              (b) => b.abbreviation.toUpperCase() === codeInFile,
            );
  
            if (!isValid || (matchById && matchById.bookId !== bookId)) {
              bookId = matchById?.bookId ?? -1;
              bookAbbr = matchById?.abbreviation ?? bookAbbr;
              bookName = matchById?.book ?? bookName;
              isValid = Boolean(matchById);
            }
          }
        } catch (err) {
          console.warn(`Failed to parse ${file.name}:`, err);
        }
  
        const isExisting = bookId !== -1 && uploadedBookIds.has(bookId);
  
        uploads.push({
          file,
          bookId,
          bookAbbr,
          bookName,
          isExisting,
          isValid,
        });
      }
  
      setPendingUploads(uploads);
      setShowConfirmDialog(true);
  
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  
    const handleUploadConfirm = async (overwriteExisting: boolean) => {
      setShowConfirmDialog(false);
      const uploadsToProcess = overwriteExisting
        ? pendingUploads
        : pendingUploads.filter((u) => !u.isExisting);
      const skipped = overwriteExisting
        ? []
        : pendingUploads.filter((u) => u.isExisting).map((u) => u.bookAbbr);
      setSkippedBooks(skipped);
  
      if (uploadsToProcess.length === 0) {
        setUploadStatus({});
        setShowUploadDialog(true);
        return;
      }
  
      const newStatus: UploadStatus = {};
      for (const upload of uploadsToProcess) {
        newStatus[upload.file.name] = {
          status: "uploading",
          bookId: upload.bookId,
          bookAbbr: upload.bookAbbr,
        };
      }
      setUploadStatus(newStatus);
      setShowUploadDialog(true);
  
      for (const upload of uploadsToProcess) {
        try {
          if (upload.isExisting && overwriteExisting) {
            const bibleBookId = getBibleBookId(upload.bookId);
            if (!bibleBookId) {
              throw new Error(
                `Could not find bible_book_id for book ${upload.bookAbbr}`,
              );
            }
            await updateBibleBook.mutateAsync({
              bible_book_id: bibleBookId,
              usfm: upload.file,
              resource_id: resourceId!,
            });
          } else {
            await uploadBible.mutateAsync({
              resource_id: resourceId!,
              usfm_file: upload.file,
            });
          }
          setUploadStatus((prev) => ({
            ...prev,
            [upload.file.name]: { ...prev[upload.file.name], status: "success" },
          }));
        } catch (err: any) {
          setUploadStatus((prev) => ({
            ...prev,
            [upload.file.name]: {
              ...prev[upload.file.name],
              status: "error",
              error: err?.message || "Upload failed",
            },
          }));
        }
      }
      queryClient.invalidateQueries({
        queryKey: ["bible-content", resourceId],
      });
    };
  
    const handleConfirmDialogClose = () => setShowConfirmDialog(false);
    const handleUploadDialogClose = () => setShowUploadDialog(false);
  
    useEffect(() => {
      (async () => {
        const res = await fetch("/data/bible_books.csv");
        const csvText = await res.text();
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => h.trim().toLowerCase(),
          complete: (result: any) => {
            const rows = (result.data as any[]).map((r) => ({
              bookId: Number(r.book_id),
              book: String(r.book_name).trim(),
              abbreviation: String(r.book_code).trim(),
              chapterCount: Number(r.chapter_count),
            })) as BibleBook[];
            setBibleBooks(rows);
          },
        });
      })();
    }, []);
  
    const oldTestamentBooks = useMemo(
      () => bibleBooks.filter((b) => b.bookId <= 39),
      [bibleBooks],
    );
  
    const newTestamentBooks = useMemo(
      () => bibleBooks.filter((b) => b.bookId >= 40),
      [bibleBooks],
    );
  
    const isBookUploaded = (id: number) => uploadedBookIds.has(id);
    const getBookButtonStyling = (id: number) =>
      isBookUploaded(id)
        ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
        : "border-gray-300 text-gray-600 bg-gray-100 hover:bg-gray-50 hover:border-gray-400";
  
    const formattedTitle = useMemo(() => {
      if (!resourceTitle) return "";
      let formatted = resourceTitle.replace(/_/g, " ").trim();
      formatted = formatted.replace(/\bBible\s*\d+\s*Books\b/i, "Bible Books");
      formatted = formatted.replace(/\s+/g, " ").trim();
      return formatted;
    }, [resourceTitle]);
  
    const { isFetching: isDownloading, refetch: fetchBibleContent } =
      useDownloadBibleContent(resourceId as number);
  
    const handleDownloadZip = async () => {
      const result = await fetchBibleContent();
  
      if (result.error) {
        const message =
          extractErrorMessage(result.error) || "Failed to download bible content";
        toast.error(message);
        return;
      }
  
      const data = result.data;
  
      if (!data || data.books.length === 0 || data.total_books === 0) {
        console.warn("No bible content available for download");
        return;
      }
  
      try {
        const zip = new JSZip();
        const sortedBooks = [...data.books].sort((a, b) => a.book_id - b.book_id);
  
        sortedBooks.forEach((book) => {
          zip.file(`${book.book_code.toUpperCase()}.usfm`, book.content);
        });
  
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${formattedTitle || "Bible"}-USFM.zip`);
      } catch (err) {
        toast.error("Failed to generate ZIP file");
      }
    };
  
    const handleDialogClose = () => {
      onClose();
      setDeleteError(null);
      setSelectedBooks([]);
      setSelectAll(false);
      setDeleteResults({ success: [], failed: [] });
    };
  
    // Auto-bypass: immediately open file picker if admin + no books + prefer upload
    useEffect(() => {
      if (!isOpen) return;
      if (!isAdmin && !isEditor) return;
  
      const empty = (bibleBooksResp?.books ?? []).length === 0;
      if (!openFileInsteadOfDialog || !empty) return;
  
      const t = setTimeout(() => {
        fileInputRef.current?.click();
        onClose();
      }, 0);
  
      return () => clearTimeout(t);
    }, [
      isOpen,
      isAdmin,
      isEditor,
      bibleBooksResp,
      openFileInsteadOfDialog,
      onClose,
    ]);
  
    const shouldBypassDialog =
      isOpen &&
      (isAdmin || isEditor) &&
      openFileInsteadOfDialog &&
      (bibleBooksResp?.books ?? []).length === 0;
  
    return (
      <div>
        {/* single hidden file input used everywhere */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".usfm,.sfm"
          onChange={handleFileUpload}
          className="hidden"
        />
  
        {!shouldBypassDialog && (
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) handleDialogClose();
            }}
          >
            <DialogContent className="w-full max-w-full max-h-[85vh] sm:max-w-2xl flex flex-col">
              {/*  <DialogContent className="w-full max-w-full sm:max-w-6xl !gap-0 min-h-[90vh] max-h-[90vh] p-4 pt-8 flex flex-col"> */}
              <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
                <DialogTitle className="text-xl font-semibold text-black">
                  {formattedTitle}
                </DialogTitle>
              </DialogHeader>
  
              {/* Books grid */}
              <div className="flex-1 overflow-auto pr-1">
                <div className="grid grid-cols-6 gap-1">
                  {oldTestamentBooks.map((book) => (
                    <div key={book.bookId} className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isBookUploaded(book.bookId)}
                        className={`h-8 py-1 text-xs font-medium uppercase tracking-wide px-2 min-w-0 w-full ${getBookButtonStyling(
                          book.bookId,
                        )}`}
                      >
                        {(isAdmin || isEditor) && (
                          <input
                            type="checkbox"
                            disabled={!isBookUploaded(book.bookId)}
                            checked={selectedBooks.includes(book.abbreviation)}
                            onChange={() => handleSelectBook(book.abbreviation)}
                            className="w-4 h-4 accent-black"
                          />
                        )}
                        <div className="flex items-center justify-between w-full">
                          <span className="flex-1 text-center truncate">
                            {book.abbreviation.toUpperCase()}
                          </span>
                        </div>
                      </Button>
                    </div>
                  ))}
                  {newTestamentBooks.map((book) => (
                    <div key={book.bookId} className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isBookUploaded(book.bookId)}
                        className={`h-8 py-1 text-xs font-medium uppercase tracking-wide px-2 min-w-0 w-full ${getBookButtonStyling(
                          book.bookId,
                        )}`}
                      >
                        {(isAdmin || isEditor) && (
                          <input
                            type="checkbox"
                            disabled={!isBookUploaded(book.bookId)}
                            checked={selectedBooks.includes(book.abbreviation)}
                            onChange={() => handleSelectBook(book.abbreviation)}
                            className="w-4 h-4 accent-black"
                          />
                        )}
                        <div className="flex items-center justify-between w-full">
                          <span className="flex-1 text-center truncate">
                            {book.abbreviation.toUpperCase()}
                          </span>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
  
              <div
                className={`flex-shrink-0 w-full flex flex-wrap ${
                  isAdmin || isEditor
                    ? "justify-center sm:justify-between"
                    : "justify-center"
                } items-center gap-4 mt-4`}
              >
                {(isAdmin || isEditor) && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 accent-black"
                      />
                      <label className="text-sm font-medium">All</label>
                    </div>
                    <Button
                      variant="destructive"
                      disabled={selectedBooks.length === 0}
                      onClick={() => setFinalConfirmOpen(true)}
                      className="cursor-pointer"
                    >
                      Delete Books
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap justify-center items-center gap-3">
                  {(isAdmin || isEditor) && (
                    <Button
                      onClick={handleUploadClick}
                      className="flex items-center gap-1 px-6 bg-gray-100 text-gray-600 border-gray-300 cursor-pointer hover:bg-gray-400"
                      title="Upload USFM/SFM files for bible books"
                    >
                      <Plus className=" h-4 w-4 mt-1" aria-hidden="true" />
                      Upload Books
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleDownloadZip}
                    disabled={isDeleting || isDownloading || !hasUploadedBooks}
                    className="flex items-center gap-2 px-6"
                    title={
                      !hasUploadedBooks
                        ? "No bible content available"
                        : "Download all USFM files as ZIP"
                    }
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? "Preparing..." : "Download"}
                  </Button>
                  <Button
                    onClick={handleDialogClose}
                    className="px-6 cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
  
        <UploadConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={handleConfirmDialogClose}
          onConfirm={handleUploadConfirm}
          pendingUploads={pendingUploads}
        />
        <UploadStatusDialog
          isOpen={showUploadDialog}
          onClose={handleUploadDialogClose}
          uploadStatus={uploadStatus}
          skippedBooks={skippedBooks}
        />
        <FinalDeleteConfirmDialog
          open={finalConfirmOpen}
          onOpenChange={setFinalConfirmOpen}
          requiredName={requiredName}
          requiredPhrase={requiredPhrase}
          onConfirm={handleFinalConfirm}
          loading={isDeleting}
          errorText={deleteError}
          title="Confirmation"
          subtitle={`To permanently delete the selected books from ${requiredName}, please type the required details below.`}
          dangerButtonText="Delete Books"
          cancelButtonText="Cancel"
        />
        <DeleteStatusDialog
          isOpen={showDeleteStatusDialog}
          onClose={() => setShowDeleteStatusDialog(false)}
          results={deleteResults}
        />
      </div>
    );
  };
  