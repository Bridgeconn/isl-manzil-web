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

import {
  parseBibleReference,
  findVerseInAvailableVerses,
} from "@/utils/bibleReferenceUtils";

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
    setCurrentPlayingVerse,
  } = useBibleStore();

  const [activeView, setActiveView] = useState<ViewType>("book");
  const [viewMode, setViewMode] = useState<DropdownType>("list");
  const [chapterOptions, setChapterOptions] = useState<ChapterOption[]>([]);
  const [verseOptions, setVerseOptions] = useState<VerseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
    const fetchVerses = async () => {
      if (selectedBook && selectedChapter) {
        try {
          const verses = await getAvailableVersesForBookAndChapter(
            selectedBook.value,
            selectedChapter.value
          );
          setVerseOptions(verses);
        } catch (error) {
          console.error("Error fetching verses:", error);
          setVerseOptions([]);
        }
      } else {
        setVerseOptions([]);
      }
    };

    fetchVerses();
  }, [
    selectedBook,
    selectedChapter,
    bibleVerseMarker,
    getAvailableVersesForBookAndChapter,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isBCVDrawerOpen) {
        if (isSearchFocused) {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSearchSubmit();
          }
          event.stopPropagation();
          return;
        }

        const videoPlayerKeys = ["f", " ", "ArrowLeft", "ArrowRight"];
        if (videoPlayerKeys.includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    if (isSearchFocused || isBCVDrawerOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [isSearchFocused, isBCVDrawerOpen, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;

    const parseResult = parseBibleReference(searchQuery, availableData.books);

    if (!parseResult.isValid) {
      setErrorMessage(parseResult.error ?? "Invalid Bible reference");
      return;
    }

    await handleBibleReferenceSearch(searchQuery);
  };

  const handleBibleReferenceSearch = async (searchInput: string) => {
    setIsSearching(true);
    setErrorMessage("");

    try {
      const parseResult = parseBibleReference(searchInput, availableData.books);

      if (!parseResult.isValid) {
        setErrorMessage(parseResult.error ?? "");
        return;
      }

      const { book, chapter, verse } = parseResult;

      // Validate chapter
      const availableChapters = getAvailableChaptersForBook(book!.value);
      const foundChapter = availableChapters.find((ch) => ch.value === chapter);

      if (!foundChapter || foundChapter.isDisabled) {
        setErrorMessage("Chapter not found");
        return;
      }

      // Validate verse if provided
      if (verse !== null) {
        const availableVerses = await getAvailableVersesForBookAndChapter(
          book!.value,
          chapter!
        );
        const foundVerse = findVerseInAvailableVerses(
          availableVerses,
          verse!.toString()
        );

        if (!foundVerse) {
          setErrorMessage("Verse not found");
          return;
        }
      }

      // Navigate to the reference
      const isBookChange = !selectedBook || selectedBook.value !== book!.value;
      const isChapterChange =
        !selectedChapter || selectedChapter.value !== chapter;

      if (isBookChange) {
        setBook(book!);
      }

      if (isChapterChange || isBookChange) {
        setChapter(foundChapter, verse === null);
      }

      if (verse !== null) {
        const delay = isBookChange
          ? 800
          : isChapterChange || isBookChange
          ? 500
          : 150;
        setTimeout(async () => {
          const availableVerses = await getAvailableVersesForBookAndChapter(
            book!.value,
            chapter!
          );
          const foundVerse = findVerseInAvailableVerses(
            availableVerses,
            verse!.toString()
          );

          if (foundVerse) {
            setVerse(foundVerse);
            setCurrentPlayingVerse(foundVerse.label);
            setActiveView("verse");
          }
        }, delay);
      } else {
        setActiveView("chapter");
      }

      setSearchQuery("");
      setErrorMessage("");
      setIsBCVDrawerOpen(false);
    } catch (error) {
      console.error("Search error:", error);
      setErrorMessage("An error occurred while searching");
    } finally {
      setIsSearching(false);
    }
  };

  const openDialog = () => {
    setIsBCVDrawerOpen(true);
    setActiveView("book");
    setSearchQuery("");
    setErrorMessage("");
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

  const getSearchBookName = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    const match = trimmed.match(/^([1-3]?\s?[a-z]+)/i);
    return match ? match[0].replace(/\s+/g, " ").trim() : trimmed;
  };

  const normalizedSearch = getSearchBookName(searchQuery);

  const filteredBooks = availableData.books.filter((book) => {
    const label = book.label.toLowerCase();
    const value = book.value.toLowerCase();
    const normalizedLabel = label.replace(/\s+/g, " ").trim();

    return (
      normalizedLabel.startsWith(normalizedSearch) ||
      normalizedLabel.includes(normalizedSearch) ||
      value.startsWith(normalizedSearch)
    );
  });

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
            className={`h-12 rounded-full flex items-center justify-center flex-wrap cursor-pointer transition-colors border ${
              chapter.isDisabled
                ? "bg-white text-gray-500 hover:cursor-not-allowed border-gray-200 shadow-sm"
                : "hover:bg-gray-50 border-gray-200 hover:shadow-inner hover:transform hover:scale-[0.98]"
            } ${
              selectedChapter?.value === chapter.value && !chapter.isDisabled
                ? "bg-gray-50 border border-gray-400 shadow-inner shadow-gray-400"
                : "shadow-sm"
            }`}
            onClick={() =>
              !chapter.isDisabled && handleChapterSelect(chapter.value)
            }
            title={
              chapter.isDisabled
                ? "The video for this Chapter is not available"
                : chapter.value === 0
                ? "Introduction"
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
            className={`h-12 border rounded-full border-gray-200 flex items-center flex-wrap justify-center cursor-pointer hover:bg-gray-100 hover:shadow-inner 
             ${
               selectedVerse?.value === verse.value
                 ? "bg-gray-50 border border-gray-400 shadow-inner shadow-gray-400"
                 : "bg-white shadow-sm"
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
    if (books.length === 0) {
      return (
        <div className="w-full flex items-center h-14 text-nowrap ">
          No matching books found
        </div>
      );
    }
    return (
      <div
        className={`grid ${
          viewMode === "list"
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-2 md:grid-cols-4"
        } gap-4 w-full`}
      >
        {books.map((book) => {
          const isSelected =
            selectedBook?.value.toLowerCase() === book.value.toLowerCase();

          if (book.isDisabled) {
            return (
              <div
                key={book.value}
                className="h-14 rounded-full flex items-center px-4 gap-2 cursor-not-allowed transition-all duration-150 border border-gray-200 shadow-sm"
                title="The videos for this book are not available"
              >
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.label}
                    className="w-13 h-13 object-contain opacity-50"
                  />
                ) : (
                  <div className="w-13 h-13 opacity-50"></div>
                )}
                <span className="text-base lg:text-lg opacity-50">
                  {book.label}
                </span>
              </div>
            );
          }

          return (
            <div
              key={book.value}
              className={`h-14  rounded-full flex items-center px-4 gap-2 cursor-pointer transition-all duration-150 border ${
                isSelected
                  ? "bg-gray-50 border border-gray-400 shadow-inner shadow-gray-400"
                  : "hover:bg-gray-50 border-gray-200 hover:shadow-inner hover:transform hover:scale-[0.98]"
              }`}
              onClick={() => handleBookSelect(book)}
            >
              {book.image ? (
                <img
                  src={book.image}
                  alt={book.label}
                  className="w-13 h-13 object-contain"
                />
              ) : (
                <div className="w-13 h-13"></div>
              )}
              <span className="text-base lg:text-lg">{book.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => (
    <div className="flex overflow-y-auto max-h-full h-fit gap-4 pr-1">
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
    <div className="flex flex-col overflow-y-auto max-h-full h-fit pr-1">
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
        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2"
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
          {selectedBook?.label ? (
            <>
              {selectedBook.label}{" "}
              {selectedChapter?.label === "0" ? "Intro" : selectedChapter?.label ?? "Chapter"}{" "}
              {selectedVerse?.label ? `: ${selectedVerse.label}` : ""}
            </>
          ) : (
            <>Loading...</>
          )}
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
        <DialogContent className="sm:max-w-6xl h-[calc(100vh-100px)] flex flex-col [&>button]:hidden pt-3">
          <DialogHeader className="flex flex-row sm:items-center justify-between gap-6 border-b border-gray-200">
            <div
              className={`flex items-center border border-gray-200 rounded-sm ${
                activeView !== "book" ? "invisible" : ""
              }`}
            >
              <button
                className={`p-2 cursor-pointer ${
                  viewMode === "list" ? "bg-gray-100" : ""
                }`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List size={21} />
              </button>
              <div className="w-px h-6 bg-gray-200"></div>
              <button
                className={`p-2 cursor-pointer ${
                  viewMode === "grid" ? "bg-gray-100" : ""
                }`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid size={21} />
              </button>
            </div>

            <div className="max-w-xl w-full mx-auto flex flex-row justify-center">
              <div className="flex w-full justify-center">
                <button
                  className={`flex flex-1 items-center justify-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
                    activeView === "book"
                      ? "text-gray-900 border-b-3 border-cyan-400 bg-gray-100"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  style={{ borderRadius: "10px 10px 0 0" }}
                  onClick={() => setActiveView("book")}
                >
                  Book
                </button>
                <button
                  className={`flex flex-1 items-center justify-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
                    activeView === "chapter"
                      ? "text-gray-900 border-b-3 border-cyan-400 bg-gray-100"
                      : !selectedBook
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  style={{ borderRadius: "10px 10px 0 0" }}
                  onClick={() => selectedBook && setActiveView("chapter")}
                  disabled={!selectedBook}
                >
                  Chapter
                </button>
                <button
                  className={`flex flex-1 items-center justify-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
                    activeView === "verse"
                      ? "text-gray-900 border-b-3 border-cyan-400 bg-gray-100"
                      : !selectedBook ||
                        !selectedChapter ||
                        verseOptions.length === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  style={{ borderRadius: "10px 10px 0 0" }}
                  onClick={() =>
                    selectedBook && selectedChapter && setActiveView("verse")
                  }
                  disabled={
                    !selectedBook ||
                    !selectedChapter ||
                    verseOptions.length === 0
                  }
                >
                  Verse
                </button>
              </div>
            </div>
            <div
              className={`flex items-center justify-end ${
                activeView !== "book" ? "invisible" : ""
              }`}
            >
              <div className="flex flex-col items-end relative">
                <div className="flex items-center border border-gray-200 rounded-full shadow-sm px-4 py-2 gap-2 max-w-[280px] w-full">
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="flex-1 outline-none bg-transparent min-w-0 overflow-hidden text-ellipsis"
                    disabled={isSearching}
                  />
                  {searchQuery && (
                    <span
                      title="Clear"
                      className="text-gray-600 hover:text-gray-800 cursor-pointer"
                      onClick={() => {
                        setSearchQuery("");
                        setErrorMessage("");
                      }}
                    >
                      <X size={16} strokeWidth={2.5}/>
                    </span>
                  )}
                  <span
                    title="Search"
                    className={`text-blue-700 hover:text-blue-900 cursor-pointer ${
                      !searchQuery.trim() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (searchQuery.trim()) {
                        handleSearchSubmit();
                      }
                    }}
                  >
                    <Search size={16} strokeWidth={2.5} />
                  </span>
                </div>

                {errorMessage && (
                  <div className="absolute top-full mt-2 right-0 z-50 max-w-[280px] w-full">
                    <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="flex items-center">
                        <p className="themed-text text-themed text-sm font-medium">
                          {errorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogClose className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
              <X className="h-5 w-5" />
            </DialogClose>
          </DialogHeader>

          <div className="overflow-y-auto flex-grow">
            {activeView === "book" &&
              (viewMode === "list" ? renderListView() : renderGridView())}

            {activeView === "chapter" && (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
                {renderChapters()}
              </div>
            )}

            {activeView === "verse" && (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
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
