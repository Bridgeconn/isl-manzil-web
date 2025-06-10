import { useState, useEffect } from "react";
import useBibleStore from "@/store/useBibleStore";

import { List, LayoutGrid, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { BookOption } from "@/types/Navigation";
import { ChapterOption } from "@/types/Navigation";
import { VerseOption } from "@/types/Navigation";

type ViewType = "book" | "chapter" | "verse";
type DropdownType = "list" | "grid";

const SelectViewContainer = () => {
  const {
    selectedBook,
    selectedChapter,
    selectedVerse,
    setBook,
    setChapter,
    setVerse,
    availableData,
    isLoading,
    isInitialized,
    initializeAvailableData,
    getAvailableChaptersForBook,
    getAvailableVersesForBookAndChapter,
  } = useBibleStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("book");
  const [viewMode, setViewMode] = useState<DropdownType>("grid");
  const [chapterOptions, setChapterOptions] = useState<ChapterOption[]>([]);
  const [verseOptions, setVerseOptions] = useState<VerseOption[]>([]);

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeAvailableData();
    }
  }, [isInitialized, isLoading, initializeAvailableData]);

  // Update chapter options when selected book changes
  useEffect(() => {
    if (selectedBook) {
      const chapters = getAvailableChaptersForBook(selectedBook.value);
      setChapterOptions(chapters);
    } else {
      setChapterOptions([]);
    }
  }, [selectedBook, getAvailableChaptersForBook]);

  // Update verse options when selected book or chapter changes
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      const verses = getAvailableVersesForBookAndChapter(
        selectedBook.value,
        selectedChapter.value
      );
      setVerseOptions(verses);
    } else {
      setVerseOptions([]);
    }
  }, [selectedBook, selectedChapter, getAvailableVersesForBookAndChapter]);

  const openDialog = (type: DropdownType) => {
    setViewMode(type);
    setIsDialogOpen(true);
    setActiveView("book");
  };

  const handleBookSelect = (bookOption: BookOption) => {
    // Only allow selection if book is available
    if (bookOption.isDisabled) {
      return;
    }

    setBook(bookOption);
    setActiveView("chapter");
  };

  const handleChapterSelect = (chapterNum: number) => {
    const chapterOption = chapterOptions.find((ch) => ch.value === chapterNum);
    if (!chapterOption || chapterOption.isDisabled) {
      return;
    }

    const chapter = {
      value: chapterNum,
      label: chapterOption.label,
    };

    setChapter(chapter as ChapterOption);
    if(chapter.value !== 0) {
      setActiveView("verse");
      return;
    }
    setIsDialogOpen(false);
  };

  const handleVerseSelect = (verseNum: number) => {
    const verseOption = verseOptions.find((v) => v.value === verseNum);

    if (!verseOption || verseOptions.length === 0) {
      setIsDialogOpen(false);
      return;
    }
    const verse = {
      value: verseNum,
      label: verseOption.label,
    };

    setVerse(verse as VerseOption);
    setIsDialogOpen(false);
  };

  const oldTestamentBooks = availableData.books.filter(
    (book) => book.bookId <= 39
  );
  const newTestamentBooks = availableData.books.filter(
    (book) => book.bookId >= 40
  );

  oldTestamentBooks.sort((a, b) => a.bookId - b.bookId);
  newTestamentBooks.sort((a, b) => a.bookId - b.bookId);

  const renderChapters = () => {
    if (!selectedBook) return null;

    return (
      <>
        {chapterOptions.map((chapter) => (
          <div
            key={`chapter-${chapter.value}`}
            className={`h-12  flex items-center justify-center flex-wrap cursor-pointer transition-colors ${
              chapter.isDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            } ${
              selectedChapter?.value === chapter.value && !chapter.isDisabled
                ? "bg-gray-300 border-2 border-gray-400"
                : ""
            }`}
            onClick={() =>
              !chapter.isDisabled && handleChapterSelect(chapter.value)
            }
            title={
              chapter.isDisabled
                ? "The video for this Chapter is not available"
                : `Chapter ${chapter.value}`
            }
          >
            {chapter.label}
          </div>
        ))}
      </>
    );
  };

  const renderVerses = () => {
    if (!selectedBook || !selectedChapter) return null;

    return (
      <>
        {verseOptions.map((verse) => (
          <div
            key={`verse-${verse.value}`}
            className={`h-12 bg-gray-200 flex items-center flex-wrap justify-center cursor-pointer hover:bg-gray-300 
             ${
               selectedVerse?.value === verse.value
                 ? "bg-gray-300 border-2 border-gray-400"
                 : ""
             }`}
            onClick={() => handleVerseSelect(verse.value)}
          >
            {verse.label}
          </div>
        ))}
      </>
    );
  };

  const renderBookGrid = (books: BookOption[]) => {
    return (
      <div
        className={`grid ${
          viewMode === "list"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
        } gap-1 w-full`}
      >
        {books.map((book) => (
          <div
            key={book.value}
            className={`h-14 flex items-center sm:justify-center gap-2 cursor-pointer transition-colors ${
              book.isDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            } ${
              selectedBook?.value.toLowerCase() === book.value.toLowerCase() &&
              !book.isDisabled
                ? "bg-gray-300 border-2 border-gray-400"
                : ""
            }`}
            onClick={() => handleBookSelect(book)}
            title={
              book.isDisabled
                ? "The videos for this book are not available"
                : book.label
            }
          >
            {book.image ? (
              <img
                src={book.image}
                alt={book.label}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <div className="w-10 h-10"></div>
            )}
            <span className="text-sm sm:text-lg sm:text-center">
              {book.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => (
    <div className="flex overflow-y-auto max-h-full h-fit gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-lg text-center mb-2">OLD TESTAMENT</h3>
        {renderBookGrid(oldTestamentBooks)}
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-lg text-center mb-2">NEW TESTAMENT</h3>
        {renderBookGrid(newTestamentBooks)}
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="flex flex-col overflow-y-auto max-h-full h-fit">
      <div className="w-full mb-4">
        <h3 className={`font-bold text-lg mb-2`}>OLD TESTAMENT</h3>
        {renderBookGrid(oldTestamentBooks)}
      </div>

      <div className="w-full">
        <h3 className="font-bold text-lg mb-2">NEW TESTAMENT</h3>
        {renderBookGrid(newTestamentBooks)}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <div className="flex gap-1">
        <button
          className={`border border-gray-300 p-2 rounded cursor-pointer hover:bg-gray-100`}
          onClick={() => openDialog("grid")}
        >
          <LayoutGrid size={24} />
        </button>
        <button
          className={`border border-gray-300 p-2 rounded cursor-pointer hover:bg-gray-100`}
          onClick={() => openDialog("list")}
        >
          <List size={24} />
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-6xl h-[calc(100vh-110px)] flex flex-col [&>button]:hidden mt-5">
          <DialogHeader className="flex flex-row sm:items-center justify-between gap-6 border-b-2">
            <div className=" max-w-2xl w-full mx-auto flex flex-col sm:flex-row justify-center gap-1">
              <button
                className={`px-4 py-2 font-semibold cursor-pointer flex-1 border-2 sm:rounded-tr-lg sm:rounded-tl-lg ${
                  activeView === "book"
                    ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                    : "bg-white text-[var(--indigo-color)]"
                }`}
                onClick={() => setActiveView("book")}
              >
                Book
              </button>
              <button
                className={`px-4 py-2 font-semibold cursor-pointer flex-1 border-2 sm:rounded-tr-lg sm:rounded-tl-lg ${
                  activeView === "chapter"
                    ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                    : "bg-white text-[var(--indigo-color)]"
                } ${!selectedBook ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => selectedBook && setActiveView("chapter")}
                disabled={!selectedBook}
              >
                Chapter
              </button>
              <button
                className={`px-4 py-2 font-semibold cursor-pointer flex-1 border-2 sm:rounded-tr-lg sm:rounded-tl-lg ${
                  activeView === "verse"
                    ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                    : "bg-white text-[var(--indigo-color)]"
                } ${
                  !selectedBook || !selectedChapter || verseOptions.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() =>
                  selectedBook && selectedChapter && setActiveView("verse")
                }
                disabled={
                  !selectedBook || !selectedChapter || verseOptions.length === 0
                }
              >
                Verse
              </button>
            </div>
            <DialogClose className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>
          <div className="overflow-y-auto flex-grow">
            {activeView === "book" &&
              (viewMode === "list" ? renderListView() : renderGridView())}

            {activeView === "chapter" && (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                {renderChapters()}
              </div>
            )}

            {activeView === "verse" && (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                {renderVerses()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectViewContainer;
