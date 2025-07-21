import { useState, useEffect } from "react";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";
import useBibleStore from "@/store/useBibleStore";
import { ChevronLeft, ChevronRight, X, Search } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { BookOption } from "@/types/Navigation";
import { ChapterOption } from "@/types/Navigation";
import { VerseOption } from "@/types/Navigation";
import useThemeStore from "@/store/useThemeStore";

import {
  parseBibleReference,
  findVerseInAvailableVerses,
} from "@/utils/bibleReferenceUtils";

type ViewType = "book" | "chapter" | "verse";

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
  const { fontType, currentTheme } = useThemeStore();

  const [activeView, setActiveView] = useState<ViewType>("book");
  const [chapterOptions, setChapterOptions] = useState<ChapterOption[]>([]);
  const [verseOptions, setVerseOptions] = useState<VerseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isInitialized && !isLoading && isBCVDrawerOpen) {
      initializeAvailableData();
    }
  }, [isInitialized, isLoading, isBCVDrawerOpen, initializeAvailableData]);

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
    setCurrentPlayingVerse(verse.label);
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
        {chapterOptions.map((chapter) => {
          const isSelected =
            selectedChapter?.value === chapter.value && !chapter.isDisabled;

          const isDisabled = chapter.isDisabled;

          const hoverClass =
            !isSelected && !isDisabled ? "hover-text-black-bg-gray" : "";

          return (
            <div
              key={`chapter-${chapter.value}`}
              className={`h-12 rounded-full flex items-center justify-center flex-wrap cursor-pointer transition-colors border
                ${
                  isDisabled
                    ? "hover:cursor-not-allowed border-gray-200 shadow-sm opacity-70"
                    : ""
                }
                ${
                  isSelected
                    ? "bg-gray-50 border border-gray-400 shadow-inner shadow-gray-400"
                    : !isDisabled
                    ? "border-gray-200 shadow-sm hover:shadow-inner hover:transform hover:scale-[0.98] hover-text-black-bg-gray"
                    : ""
                }
                ${fontType === "serif" ? "font-serif" : "font-sans"}
                ${hoverClass}
              `}
              onClick={() =>
                !chapter.isDisabled && handleChapterSelect(chapter.value)
              }
              title={
                chapter.value === 0 && chapter.isDisabled
                  ? "Introduction video is not available"
                  : chapter.isDisabled
                  ? "The video for this Chapter is not available"
                  : chapter.value === 0
                  ? `Introduction to ${selectedBook.label}`
                  : `${selectedBook.label} ${chapter.value}`
              }
              style={{
                backgroundColor: isSelected ? currentTheme?.selected : "",
                color: isSelected
                  ? currentTheme?.backgroundColor
                  : currentTheme?.textColor,
              }}
            >
              {chapter.label}
            </div>
          );
        })}
      </>
    );
  };

  const renderVerses = () => {
    if (!selectedBook || !selectedChapter) return null;

    return (
      <>
        {verseOptions.map((verse) => {
          const isSelected = selectedVerse?.value === verse.value;

          return (
            <div
              key={`verse-${verse.value}`}
              className={`h-12 border rounded-full border-gray-200 flex items-center flex-wrap justify-center cursor-pointer
                ${
                  isSelected
                    ? "bg-gray-50 border border-gray-400 shadow-inner shadow-gray-400"
                    : "shadow-sm hover:shadow-inner hover:transform hover:scale-[0.98] hover-text-black-bg-gray"
                } ${fontType === "serif" ? "font-serif" : "font-sans"}
              `}
              onClick={() => handleVerseSelect(verse.value)}
              title={
                verse.value === 0
                  ? `Introduction to ${selectedBook.label} ${selectedChapter.label}`
                  : `${selectedBook.label} ${selectedChapter.label}:${
                      verse.label.includes("_")
                        ? verse.label.replace(/_/g, "-")
                        : verse.label
                    }`
              }
              style={{
                backgroundColor: isSelected ? currentTheme?.selected : "",
                color: isSelected
                  ? currentTheme?.backgroundColor
                  : currentTheme?.textColor,
              }}
            >
              {verse.label.includes("_")
                ? verse.label.replace(/_/g, "-")
                : verse.label}
            </div>
          );
        })}
      </>
    );
  };

  const renderBookGrid = (books: BookOption[]) => {
    if (books.length === 0) {
      return (
        <div
          className={`w-full flex items-center h-14 text-nowrap ${
            fontType === "serif" ? "font-serif" : "font-sans"
          }`}
          style={{ color: currentTheme?.textColor }}
        >
          No matching books found
        </div>
      );
    }
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 w-full`}>
        {books.map((book) => {
          const isSelected =
            selectedBook?.value.toLowerCase() === book.value.toLowerCase();

          if (book.isDisabled) {
            return (
              <div
                key={book.value}
                className="h-14 rounded-full flex items-center gap-4 cursor-not-allowed transition-all duration-150 border border-gray-200 shadow-sm"
                title="The videos for this book are not available"
              >
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.label}
                    className="w-13 h-13 object-contain opacity-50 bg-gray-100 rounded-full"
                  />
                ) : (
                  <div className="w-13 h-13 opacity-50"></div>
                )}
                <span
                  className={`text-base lg:text-lg opacity-50 ${
                    fontType === "serif" ? "font-serif" : "font-sans"
                  }`}
                  style={{ color: currentTheme?.textColor }}
                >
                  {book.label}
                </span>
              </div>
            );
          }

          return (
            <div
              key={book.value}
              className={`h-14 rounded-full flex items-center gap-4 cursor-pointer transition-all duration-150 border ${
                isSelected
                  ? "bg-gray-50 border border-gray-400 shadow-inner shadow-gray-400"
                  : "border-gray-200 hover:shadow-inner hover:transform hover:scale-[0.98] hover-text-black-bg-gray"
              }`}
              onClick={() => handleBookSelect(book)}
              style={{
                backgroundColor: isSelected ? currentTheme?.selected : "",
              }}
            >
              {book.image ? (
                <img
                  src={book.image}
                  alt={book.label}
                  className="w-13 h-13 object-contain bg-gray-100 rounded-full"
                />
              ) : (
                <div className="w-13 h-13"></div>
              )}
              <span
                className={`text-base lg:text-lg ${
                  fontType === "serif" ? "font-serif" : "font-sans"
                }`}
                style={{
                  color: isSelected
                    ? currentTheme?.backgroundColor
                    : currentTheme?.textColor,
                }}
              >
                {book.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => (
    <div className="flex max-h-full h-fit gap-4 pr-1">
      <div className="flex-1">
        <h3
          className={`font-bold text-lg text-center mb-2 ${
            fontType === "serif" ? "font-serif" : "font-sans"
          }`}
          style={{ color: currentTheme?.textColor }}
        >
          OLD TESTAMENT
        </h3>
        {renderBookGrid(oldTestamentBooks)}
      </div>

      <div className="flex-1">
        <h3
          className={`font-bold text-lg text-center mb-2 ${
            fontType === "serif" ? "font-serif" : "font-sans"
          }`}
          style={{ color: currentTheme?.textColor }}
        >
          NEW TESTAMENT
        </h3>
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
          backgroundColor: currentTheme?.id === "theme3" ? "white": "",
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
          className="text-base font-medium text-gray-700 px-2 cursor-pointer"
          style={{ color: currentTheme?.id === "theme3" ? currentTheme?.backgroundColor : currentTheme?.textColor }}
          onClick={openDialog}
        >
          {selectedBook?.label ? (
            <>
              {selectedBook.label}{" "}
              {selectedChapter?.label === "0"
                ? "Intro"
                : selectedChapter?.label ?? "Chapter"}{" "}
              {selectedVerse?.label
                ? `: ${
                    selectedVerse.label.includes("_")
                      ? selectedVerse.label.replace(/_/g, "-")
                      : selectedVerse.label
                  }`
                : ""}
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
        <DialogContent className="sm:max-w-6xl h-[calc(100vh-100px)] flex flex-col [&>button]:hidden p-3 pr-0 themed-bg">
          <DialogHeader className="flex flex-row sm:items-center justify-between gap-6 border-b border-gray-200 pr-2">
            <div className="max-w-xl w-full flex flex-row justify-start">
              <div className="flex w-full justify-center">
                <button
                  className={`flex flex-1 items-center justify-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
                    activeView === "book"
                      ? "text-gray-900 border-b-3 border-cyan-400 bg-gray-100"
                      : "text-gray-500 hover:bg-gray-100 custom-hover-black"
                  } ${fontType === "serif" ? "font-serif" : "font-sans"}`}
                  style={{
                    borderRadius: "10px 10px 0 0",
                    color: activeView === "book" ? "" : currentTheme?.textColor,
                  }}
                  onClick={() => setActiveView("book")}
                >
                  Book
                </button>
                <button
                  className={`flex flex-1 items-center justify-center gap-2 px-6 py-3 font-medium transition-all duration-200
                      ${
                        activeView === "chapter"
                          ? "text-gray-900 border-b-3 border-cyan-400 bg-gray-100"
                          : !selectedBook
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-100 custom-hover-black"
                      } ${fontType === "serif" ? "font-serif" : "font-sans"}
                  `}
                  style={{
                    borderRadius: "10px 10px 0 0",
                    color:
                      activeView === "chapter" || !selectedBook
                        ? undefined
                        : currentTheme?.textColor,
                  }}
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
                      : "text-gray-500 hover:bg-gray-100 custom-hover-black"
                  } ${fontType === "serif" ? "font-serif" : "font-sans"}`}
                  style={{
                    borderRadius: "10px 10px 0 0",
                    color:
                      activeView === "verse" ||
                      !selectedBook ||
                      !selectedChapter ||
                      verseOptions.length === 0
                        ? undefined
                        : currentTheme?.textColor,
                  }}
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
              className={`flex items-center justify-end ml-auto ${
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
                    className={`flex-1 outline-none bg-transparent min-w-0 overflow-hidden text-ellipsis ${
                      fontType === "serif" ? "font-serif" : "font-sans"
                    } ${currentTheme?.id === "theme3" ? "placeholder:text-white" : ""}`}
                    disabled={isSearching}
                    style={{
                      color: currentTheme?.textColor,
                    }}
                  />
                  {searchQuery && (
                    <span
                      title="Clear"
                      className="text-gray-600 hover:text-gray-800 cursor-pointer"
                      onClick={() => {
                        setSearchQuery("");
                        setErrorMessage("");
                      }}
                      style={{
                        color: currentTheme?.textColor,
                      }}
                    >
                      <X size={16} strokeWidth={2.5} />
                    </span>
                  )}
                  <span
                    title="Search"
                    className={`text-blue-900 cursor-pointer ${
                      !searchQuery.trim() ? "opacity-70 cursor-not-allowed" : ""
                    } ${currentTheme?.id === "theme3" ? "text-white" : ""}`}
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
            <DialogClose
              className="h-6 w-6 rounded-sm opacity-100 ring-offset-background transition-opacity"
              style={{ color: currentTheme?.textColor }}
            >
              <X className="h-5 w-5" />
            </DialogClose>
          </DialogHeader>

          <div className="overflow-y-auto flex-grow custom-scroll-ultra-thin pr-2">
            {activeView === "book" && renderListView()}

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
