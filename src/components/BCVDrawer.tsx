import { useState, useEffect } from "react";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";
import useBibleStore from "@/store/useBibleStore";
import {
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  X,
  Search,
} from "lucide-react";
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

const BCVDrawer = () => {
  const { selectedBook, selectedChapter, selectedVerse } = useBibleStore();
  const { canGoPrevious, canGoNext, navigateToChapter } =
    useChapterNavigation();
  const [isBCVDrawerOpen, setIsBCVDrawerOpen] = useState(false);

  const {
    setBook,
    setChapter,
    setVerse,
    availableData,
    isLoading,
    isInitialized,
    initializeAvailableData,
    getAvailableChaptersForBook,
    getAvailableVersesForBookAndChapter,
    bibleVerseMarker,
    getBibleVerseMarker,
  } = useBibleStore();

  const [activeView, setActiveView] = useState<ViewType>("book");
  const [viewMode, setViewMode] = useState<DropdownType>("list");
  const [chapterOptions, setChapterOptions] = useState<ChapterOption[]>([]);
  const [verseOptions, setVerseOptions] = useState<VerseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeAvailableData();
    }
  }, [isInitialized, isLoading, initializeAvailableData]);

  useEffect(() => {
    if (selectedBook) {
      const chapters = getAvailableChaptersForBook(selectedBook.value);
      setChapterOptions(chapters);
    } else {
      setChapterOptions([]);
    }
  }, [selectedBook, getAvailableChaptersForBook]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      getBibleVerseMarker();
    }
  }, [selectedBook, selectedChapter, getBibleVerseMarker]);


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
  }, [
    selectedBook,
    selectedChapter,
    bibleVerseMarker,
    getAvailableVersesForBookAndChapter,
  ]);

  const openDialog = () => {
    setIsBCVDrawerOpen(true);
    setActiveView("book");
    setSearchQuery("");
  };

  const handleBookSelect = (bookOption: BookOption) => {
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
    if (chapter.value !== 0) {
      setActiveView("verse");
      return;
    }
    setIsBCVDrawerOpen(false);
  };

  const handleVerseSelect = (verseNum: number) => {
    const verseOption = verseOptions.find((v) => v.value === verseNum);

    if (!verseOption || verseOptions.length === 0) {
      setIsBCVDrawerOpen(false);
      return;
    }
    const verse = {
      value: verseNum,
      label: verseOption.label,
    };

    setVerse(verse as VerseOption);
    setIsBCVDrawerOpen(false);
  };

  // Filter books based on search query
  const filteredBooks = availableData.books.filter((book) =>
    book.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const oldTestamentBooks = filteredBooks.filter((book) => book.bookId <= 39);
  const newTestamentBooks = filteredBooks.filter((book) => book.bookId >= 40);

  oldTestamentBooks.sort((a, b) => a.bookId - b.bookId);
  newTestamentBooks.sort((a, b) => a.bookId - b.bookId);

  const renderChapters = () => {
    if (!selectedBook) return null;

    return (
      <>
        {chapterOptions.map((chapter) => (
          <div
            key={`chapter-${chapter.value}`}
            className={`h-12 flex items-center justify-center flex-wrap cursor-pointer transition-colors border ${
              chapter.isDisabled
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-200 hover:bg-gray-100"
            } ${
              selectedChapter?.value === chapter.value && !chapter.isDisabled
                ? "bg-gray-100 border-2 border-gray-400 ring-2 ring-gray-100"
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
            className={`h-12 border border-gray-200 flex items-center flex-wrap justify-center cursor-pointer hover:bg-gray-100 
             ${
               selectedVerse?.value === verse.value
                 ? "bg-gray-100 border-2 border-gray-400 ring-2 ring-gray-100"
                 : "bg-white"
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
            className={`h-14 flex items-center sm:justify-center gap-2 cursor-pointer transition-colors border ${
              book.isDisabled
                ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                : "hover:bg-gray-100 border-gray-200"
            } ${
              selectedBook?.value.toLowerCase() === book.value.toLowerCase() &&
              !book.isDisabled
                ? "bg-gray-100 border-2 border-gray-400 ring-2 ring-gray-100"
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
    <>
      <div
        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-md px-3 py-2"
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.2) 0px 4px 6px -1px," +
            "rgba(0, 0, 0, 0.14) 0px 2px 4px 0px," +
            "rgba(0, 0, 0, 0.12) 0px -1px 4px 0px",
          transition: "box-shadow 0.3s ease-in-out",
        }}
      >
        <button
          className="p-1 text-gray-600 hover:text-[var(--indigo-color)] transition-all duration-200 hover:scale-105"
          title="Previous Chapter"
        >
          {canGoPrevious && (
            <ChevronLeft
              size={20}
              onClick={() => navigateToChapter("previous")}
            />
          )}
        </button>
        <span
          className="text-sm font-medium text-gray-700 px-2 cursor-pointer"
          onClick={openDialog}
        >
          {selectedBook?.label ?? "Book"} {selectedChapter?.label ?? "Chapter"}{" "}
          : {selectedVerse?.label ?? "Verse"}
        </span>
        <button
          className="p-1 text-gray-600 hover:text-[var(--indigo-color)] transition-all duration-200 hover:scale-105"
          title="Next Chapter"
        >
          {canGoNext && (
            <ChevronRight size={20} onClick={() => navigateToChapter("next")} />
          )}
        </button>
      </div>

      <Dialog open={isBCVDrawerOpen} onOpenChange={setIsBCVDrawerOpen}>
        <DialogContent className="sm:max-w-6xl h-[calc(100vh-100px)] flex flex-col [&>button]:hidden">
          <DialogHeader className="flex flex-row sm:items-center justify-between gap-6 pb-2 border-b">
            {activeView === "book" && (
              <div className="flex gap-1">
                <button
                  className={`border border-gray-300 p-2 rounded cursor-pointer transition-colors ${
                    viewMode === "list"
                      ? "bg-gray-200 text-gray-800"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List size={20} />
                </button>
                <button
                  className={`border border-gray-300 p-2 rounded cursor-pointer transition-colors ${
                    viewMode === "grid"
                      ? "bg-gray-200 text-gray-800"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid size={20} />
                </button>
              </div>
            )}
            <div className="max-w-xl w-full mx-auto flex flex-col sm:flex-row justify-center gap-2">
              <button
                className={`px-4 py-2 font-semibold cursor-pointer flex-1 rounded-sm ${
                  activeView === "book"
                    ? "bg-gray-200 text-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
                } ${!selectedBook && activeView === "book" ? "" : ""}`}
                style={{
                  backgroundColor:
                    activeView === "book"
                      ? "rgb(229, 231, 235)"
                      : "rgb(255, 255, 255)",
                  boxShadow: "rgb(128, 128, 128) 1px 1px 1px 1px",
                  transition:
                    "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgb(255, 255, 255)",
                }}
                onClick={() => setActiveView("book")}
              >
                Book
              </button>
              <button
                className={`px-4 py-2 font-semibold cursor-pointer flex-1 rounded-sm ${
                  activeView === "chapter"
                    ? "text-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
                } ${!selectedBook ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{
                  backgroundColor:
                    activeView === "chapter"
                      ? "rgb(229, 231, 235)"
                      : "rgb(255, 255, 255)",
                  boxShadow: "rgb(128, 128, 128) 1px 1px 1px 1px",
                  transition:
                    "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgb(255, 255, 255)",
                }}
                onClick={() => selectedBook && setActiveView("chapter")}
                disabled={!selectedBook}
              >
                Chapter
              </button>
              <button
                className={`px-4 py-2 font-semibold cursor-pointer flex-1 rounded-sm ${
                  activeView === "verse"
                    ? "text-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
                } ${
                  !selectedBook || !selectedChapter || verseOptions.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                style={{
                  backgroundColor:
                    activeView === "verse"
                      ? "rgb(229, 231, 235)"
                      : "rgb(255, 255, 255)",
                  boxShadow: "rgb(128, 128, 128) 1px 1px 1px 1px",
                  transition:
                    "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgb(255, 255, 255)",
                }}
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
            {activeView === "book" && (
              <div className="flex items-center justify-end p-2">
                <div
                  className="relative max-w-md rounded-full"
                  style={{
                    boxShadow:
                      "rgba(0, 0, 0, 0.2) 0px 4px 6px -1px," +
                      "rgba(0, 0, 0, 0.14) 0px 2px 4px 0px," +
                      "rgba(0, 0, 0, 0.12) 0px -1px 4px 0px",
                    transition: "box-shadow 0.3s ease-in-out",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 focus:outline-none"
                  />
                  <Search
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-700 hover:text-blue-900"
                    size={16}
                  />
                </div>
              </div>
            )}
            <DialogClose className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
              <X className="h-5 w-5" />
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
    </>
  );
};

export default BCVDrawer;
