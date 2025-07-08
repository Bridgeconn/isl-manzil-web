import React, { useState, useEffect, useRef } from "react";
import { Search, X, List, LayoutGrid } from "lucide-react";
import useBibleStore from "@/store/useBibleStore";
import { BookOption, ChapterOption, VerseOption } from "../types/Navigation";
import useDeviceDetection from "@/hooks/useDeviceDetection";
import {
  parseBibleReference,
  findVerseInAvailableVerses,
} from "@/utils/bibleReferenceUtils";

interface MobileBookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = "Book" | "Chapter" | "Verse";
type DropdownType = "list" | "grid";

const MobileBookDrawer: React.FC<MobileBookDrawerProps> = ({
  isOpen,
  onClose,
}) => {
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
    loadVideoForCurrentSelection,
    setCurrentPlayingVerse,
    getBibleVerseMarker,
    bibleVerseMarker,
  } = useBibleStore();

  const { deviceType, isMobileLandscape } = useDeviceDetection();

  const [activeView, setActiveView] = useState<ViewType>("Book");
  const [viewMode, setViewMode] = useState<DropdownType>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<BookOption[]>([]);
  const [chapterOptions, setChapterOptions] = useState<ChapterOption[]>([]);
  const [verseOptions, setVerseOptions] = useState<VerseOption[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const booksListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
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
        console.error('Error fetching verses:', error);
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
    if (searchTerm.trim() === "") {
      setFilteredBooks(availableData.books || []);
      setErrorMessage("");
    } else {
      const filtered = (availableData.books || []).filter((book) =>
        book.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
      setErrorMessage("");
    }
  }, [searchTerm, availableData.books]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearchSubmit();
      }
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isSearchFocused, searchTerm]);

  const oldTestamentBooks = filteredBooks.filter((book) => book.bookId <= 39);
  const newTestamentBooks = filteredBooks.filter((book) => book.bookId >= 40);

  oldTestamentBooks.sort((a, b) => a.bookId - b.bookId);
  newTestamentBooks.sort((a, b) => a.bookId - b.bookId);

  const handleSearchSubmit = async () => {
    if (!searchTerm.trim()) return;

    const parseResult = parseBibleReference(searchTerm, availableData.books);

    if (!parseResult.isValid) {
      setErrorMessage(parseResult.error ?? "Invalid Bible reference");
      return;
    }

    await handleBibleReferenceSearch(searchTerm);
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
        setChapter(foundChapter);
      }

      if (verse !== null) {
        const delay = isBookChange
          ? 800
          : isChapterChange || isBookChange
          ? 500
          : 150;
        setTimeout(async() => {
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
            setActiveView("Verse");
          }
        }, delay);
      } else {
        setActiveView("Chapter");
      }

      setSearchTerm("");
      setErrorMessage("");
      onClose();

      setTimeout(() => {
        loadVideoForCurrentSelection();
      }, 100);
    } catch (error) {
      console.error("Search error:", error);
      setErrorMessage("An error occurred while searching");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookClick = (book: BookOption) => {
    if (book.isDisabled) return;

    setBook(book);
    setActiveView("Chapter");
  };

  const handleChapterClick = (chapter: ChapterOption) => {
    if (chapter.isDisabled) return;

    setChapter(chapter);
    setActiveView("Verse");

  };

  const handleVerseClick = (verse: VerseOption) => {
    setVerse(verse);
    setCurrentPlayingVerse(verse.label);

    onClose();
  };

  const clearSearch = () => {
    setSearchTerm("");
    setErrorMessage("");
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setErrorMessage("");
    setActiveView("Book");
  };

  const handleTabClick = (tab: ViewType) => {
    if (tab === "Book") {
      setActiveView("Book");
    } else if (tab === "Chapter" && selectedBook) {
      setActiveView("Chapter");
    } else if (
      tab === "Verse" &&
      selectedBook &&
      selectedChapter &&
      verseOptions.length > 0
    ) {
      setActiveView("Verse");
    }
  };

  const handleSearchButtonClick = () => {
    handleSearchSubmit();
  };

  const renderBookGrid = (books: BookOption[]) => {
    if (books.length === 0) {
      return (
        <div className="w-full flex items-center h-14 text-nowrap">
          No matching books found
        </div>
      );
    }
    const gridCols =
      deviceType === "tablet"
        ? viewMode === "list"
          ? "grid-cols-2"
          : "grid-cols-4"
        : "grid-cols-2 sm:grid-cols-4";

    return (
      <div className={`grid ${gridCols} gap-3`}>
        {books.map((book) =>
          book.isDisabled ? (
            <div
              key={book.value}
              className="h-10 pt-1 mb-1 rounded-full flex items-center px-2 sm:px-4 gap-1 sm:gap-2 cursor-not-allowed transition-all duration-150 bg-white text-gray-500 border border-gray-200 shadow-sm"
              title="The videos for this book are not available"
            >
              {book.image ? (
                <img
                  src={book.image}
                  alt={book.label}
                  className="w-9 h-9 object-contain opacity-50"
                />
              ) : (
                <div className="w-9 h-9 opacity-50" />
              )}
              <span className="text-sm font-medium leading-tight opacity-50">
                {book.label}
              </span>
            </div>
          ) : (
            <div
              key={book.value}
              className={`h-10 pt-1 mb-1 rounded-full flex items-center px-2 sm:px-4 gap-1 sm:gap-2 cursor-pointer transition-all duration-150 border border-gray-200 ${
                selectedBook?.value.toLowerCase() === book.value.toLowerCase()
                  ? "bg-gray-100 border border-gray-400 shadow-inner shadow-gray-400 transform scale-[0.98]"
                  : "hover:bg-gray-50 hover:shadow-inner hover:transform hover:scale-[0.98]"
              }`}
              onClick={() => handleBookClick(book)}
            >
              {book.image ? (
                <img
                  src={book.image}
                  alt={book.label}
                  className="w-9 h-9 object-contain"
                />
              ) : (
                <div className="w-9 h-9" />
              )}
              <span className="text-sm font-medium leading-tight">
                {book.label}
              </span>
            </div>
          )
        )}
      </div>
    );
  };

  const renderTabletListView = () => (
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

  const renderTabletGridView = () => (
    <div className="flex flex-col overflow-y-auto max-h-full h-fit pr-1">
      <div className="w-full mb-4">
        <h3 className="font-bold text-lg mb-2">OLD TESTAMENT</h3>
        {renderBookGrid(oldTestamentBooks)}
      </div>
      <div className="w-full">
        <h3 className="font-bold text-lg mb-2">NEW TESTAMENT</h3>
        {renderBookGrid(newTestamentBooks)}
      </div>
    </div>
  );

    const renderBooks = () => {
    if (deviceType === "tablet") {
      return viewMode === "list"
        ? renderTabletListView()
        : renderTabletGridView();
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-2">
        {filteredBooks.map((book) => {
          const isSelected = selectedBook?.value.toLowerCase() === book.value.toLowerCase();
          
          if (book.isDisabled) {
            return (
              <div
                key={book.value}
                className="h-10 pt-1 mb-1 rounded-full flex items-center lg:pl-8 gap-1 sm:gap-2 lg:gap-4 cursor-not-allowed transition-all duration-150 bg-white text-gray-500 border border-gray-200 shadow-sm"
              >
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.label}
                    className="w-9 h-9 object-contain opacity-50"
                  />
                ) : (
                  <div className="w-9 h-9 opacity-50" />
                )}
                <span className="text-sm font-medium leading-tight">
                  {book.label}
                </span>
              </div>
            );
          }

          return (
            <div
              key={book.value}
              className={`h-10 pt-1 mb-1 rounded-full flex items-center lg:pl-8 gap-1 sm:gap-2 lg:gap-4 cursor-pointer transition-all duration-150 border border-gray-200 ${
                isSelected
                  ? "bg-gray-100 border border-gray-400 shadow-inner shadow-gray-400 transform scale-[0.98]"
                  : "shadow-sm"
              }`}
              onClick={() => handleBookClick(book)}
            >
              {book.image ? (
                <img
                  src={book.image}
                  alt={book.label}
                  className="w-9 h-9 object-contain"
                />
              ) : (
                <div className="w-9 h-9" />
              )}
              <span className="text-sm font-medium leading-tight">
                {book.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChapters = () => (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pr-2">
      {chapterOptions.map((chapter) => (
        <div
          key={chapter.value}
          onClick={() => !chapter.isDisabled && handleChapterClick(chapter)}
          className={`h-10 rounded-full text-sm flex items-center justify-center cursor-pointer transition-colors border ${
            chapter.isDisabled
              ? "bg-white text-gray-500 cursor-not-allowed border-gray-200 shadow-sm"
              : "border-gray-200"
          } ${
            selectedChapter?.value === chapter.value && !chapter.isDisabled
              ? "bg-gray-100 border border-gray-400 shadow-inner shadow-gray-400 transform scale-[0.98]"
              : "shadow-sm"
          }`}
        >
          {chapter.label}
        </div>
      ))}
    </div>
  );

  const renderVerses = () => (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pr-2">
      {verseOptions.map((verse) => (
        <div
          key={verse.value}
          onClick={() => handleVerseClick(verse)}
          className={`h-10 border rounded-full text-sm border-gray-200 flex items-center justify-center cursor-pointer ${
            selectedVerse?.value === verse.value
              ? "bg-gray-100 border border-gray-400 shadow-inner shadow-gray-400 transform scale-[0.98]"
              : "bg-white shadow-sm"
          }`}
        >
          {verse.label}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      <div
        className={`fixed inset-0 z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="px-6 py-4 h-full overflow-hidden flex flex-col">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            {deviceType === "tablet" && activeView === "Book" && (
              <div className="flex items-center border border-gray-200 rounded-sm">
                <button
                  className={`p-2 cursor-pointer ${
                    viewMode === "list" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List size={21} />
                </button>
                <div className="w-px h-6 bg-gray-200"></div>
                <button
                  className={`p-2 cursor-pointer ${
                    viewMode === "grid" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid size={21} />
                </button>
              </div>
            )}

            <div className="flex-1 relative">
              <button
                onClick={handleSearchButtonClick}
                disabled={isSearching}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors"
              >
                <Search size={20} />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`${
                  deviceType === "tablet" || isMobileLandscape
                    ? "Search books or Bible reference (e.g., John 3:16)..."
                    : "Search books"
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-10 py-3 border-2 rounded-full focus:border-gray-400 focus:outline-none text-gray-700 placeholder-gray-400"
                disabled={isSearching}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  disabled={isSearching}
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="themed-text text-themed text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            {(["Book", "Chapter", "Verse"] as ViewType[]).map((tab) => {
              const isDisabled =
                (tab === "Chapter" && !selectedBook) ||
                (tab === "Verse" &&
                  (!selectedBook ||
                    !selectedChapter ||
                    verseOptions.length === 0));

              return (
                <button
                  key={tab}
                  onClick={() => !isDisabled && handleTabClick(tab)}
                  disabled={isDisabled}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm lg:text-base font-medium transition-colors duration-200 ${
                    activeView === tab
                      ? "text-gray-900 border-b-2 border-gray-900 bg-gray-50"
                      : isDisabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-500"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div ref={booksListRef} className="flex-1 min-h-0 overflow-y-auto">
            {activeView === "Book" &&
              (filteredBooks.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
                  {searchTerm
                    ? `No books found matching "${searchTerm}"`
                    : "No books available"}
                </div>
              ) : (
                renderBooks()
              ))}

            {activeView === "Chapter" &&
              (chapterOptions.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
                  No chapters available
                </div>
              ) : (
                renderChapters()
              ))}

            {activeView === "Verse" &&
              (verseOptions.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
                  No verses available
                </div>
              ) : (
                renderVerses()
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBookDrawer;
