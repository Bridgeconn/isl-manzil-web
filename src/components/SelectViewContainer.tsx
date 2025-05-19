import { useState, useEffect, useRef } from "react";
import bookCodesData from "../assets/data/book_codes.json";
import versificationData from "../assets/data/versification.json";
import { VersificationData } from "../types/bible";
import useBibleStore from "@/store/useBibleStore";
import { List } from "lucide-react";
import { LayoutGrid } from "lucide-react";

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
  } = useBibleStore();

  const [activeDropdown, setActiveDropdown] = useState<DropdownType | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("book");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const gridButtonRef = useRef<HTMLButtonElement>(null);

  const typedVersificationData = versificationData as VersificationData;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        listButtonRef.current &&
        !listButtonRef.current.contains(event.target as Node) &&
        gridButtonRef.current &&
        !gridButtonRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    
    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleDropdown = (type: DropdownType) => {
    if (activeDropdown === type) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(type);
      setActiveView("book");
    }
  };

  const selectView = (view: ViewType) => {
    setActiveView(view);
  };

  const handleBookSelect = (
    bookCode: string,
    bookName: string,
    bookId: number,
    filename?: string
  ) => {
    const bookOption = {
      value: bookCode,
      label: bookName,
      bookId: bookId,
      image: filename ? "/books/" + filename : "",
    };

    setBook(bookOption);
    setActiveView("chapter");
  };

  const handleChapterSelect = (chapterNum: number) => {
    const chapterOption = {
      value: chapterNum,
      label: `${chapterNum}`,
    };

    setChapter(chapterOption);
    setActiveView("verse");
  };

  const handleVerseSelect = (verseNum: number) => {
    const verseOption = {
      value: verseNum,
      label: `${verseNum}`,
    };

    setVerse(verseOption);
    setActiveDropdown(null);
  };

  const oldTestamentBooks = bookCodesData.filter((book) => book.bookId <= 39);
  const newTestamentBooks = bookCodesData.filter((book) => book.bookId >= 40);

  const renderChapters = () => {
    if (!selectedBook) return null;

    const maxChapters =
      typedVersificationData.maxVerses[selectedBook.value.toUpperCase()]
        ?.length || 0;
    const chapters = Array.from({ length: maxChapters }, (_, i) => i + 1);

    return (
      <>
        {chapters.map((chapter) => (
          <div
            key={`chapter-${chapter}`}
            className={`bg-gray-200 p-2 sm:p-4 flex items-center justify-center flex-wrap cursor-pointer hover:bg-gray-300 ${
              selectedChapter?.value === chapter
                ? "bg-gray-300 border-2 border-gray-400"
                : ""
            }`}
            onClick={() => handleChapterSelect(chapter)}
          >
            {chapter}
          </div>
        ))}
      </>
    );
  };

  const renderVerses = () => {
    if (!selectedBook || !selectedChapter) return null;

    const bookCode = selectedBook.value.toUpperCase();
    const chapterIndex = selectedChapter.value - 1;
    const maxVerses = parseInt(
      typedVersificationData.maxVerses[bookCode]?.[chapterIndex] || "0"
    );
    const verses = Array.from({ length: maxVerses }, (_, i) => i + 1);

    return (
      <>
        {verses.map((verse) => (
          <div
            key={`verse-${verse}`}
            className={`bg-gray-200 p-2 sm:p-4 flex items-center flex-wrap justify-center cursor-pointer hover:bg-gray-300 ${
              selectedVerse?.value === verse
                ? "bg-gray-300 border-2 border-gray-400"
                : ""
            }`}
            onClick={() => handleVerseSelect(verse)}
          >
            {verse}
          </div>
        ))}
      </>
    );
  };

  const renderBooksListView = () => {
    return (
      <div className="flex gap-4 overflow-y-auto max-h-full h-fit">
        <div className="flex-1">
          <div className="mb-2">
            <h3 className="font-bold text-lg text-center">
              OLD TESTAMENT
            </h3>
          </div>
          <div className="space-y-2">
            {oldTestamentBooks.map((book) => (
              <div
                key={book.bookCode}
                className={`bg-gray-200 p-4 h-22 flex items-center gap-4 cursor-pointer hover:bg-gray-300 ${
                  selectedBook?.value.toLowerCase() ===
                  book.bookCode.toLowerCase()
                    ? "bg-gray-300 border-2 border-gray-400"
                    : ""
                }`}
                onClick={() =>
                  handleBookSelect(
                    book.bookCode,
                    book.book,
                    book.bookId,
                    book.filename
                  )
                }
              >
                {book.filename ? (
                  <img
                    src={`/books/${book.filename}`}
                    alt={book.book}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12"></div>
                )}
                <span className="text-lg">{book.book}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-2">
            <h3 className="font-bold text-lg text-center">
              NEW TESTAMENT
            </h3>
          </div>
          <div className="space-y-2">
            {newTestamentBooks.map((book) => (
              <div
                key={book.bookCode}
                className={`bg-gray-200 p-4 h-22 flex items-center gap-4 cursor-pointer hover:bg-gray-300 ${
                  selectedBook?.value.toLowerCase() ===
                  book.bookCode.toLowerCase()
                    ? "bg-gray-300 border-2 border-gray-400"
                    : ""
                }`}
                onClick={() =>
                  handleBookSelect(
                    book.bookCode,
                    book.book,
                    book.bookId,
                    book.filename
                  )
                }
              >
                {book.filename ? (
                  <img
                    src={`/books/${book.filename}`}
                    alt={book.book}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12"></div>
                )}
                <span className="text-lg">{book.book}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBooksGridView = () => {
    return (
      <div className="overflow-y-auto max-h-full h-fit">
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">
            OLD TESTAMENT
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {oldTestamentBooks.map((book) => (
              <div
                key={book.bookCode}
                className={`bg-gray-200 p-4 flex flex-col sm:flex-row justify-between sm:justify-start items-center text-center sm:text-left gap-1 cursor-pointer hover:bg-gray-300 ${
                  selectedBook?.value.toLowerCase() ===
                  book.bookCode.toLowerCase()
                    ? "bg-gray-300 border-2 border-gray-400"
                    : ""
                }`}
                onClick={() =>
                  handleBookSelect(
                    book.bookCode,
                    book.book,
                    book.bookId,
                    book.filename
                  )
                }
              >
                {book.filename ? (
                  <img
                    src={`/books/${book.filename}`}
                    alt={book.book}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12"></div>
                )}
                <span className="text-sm sm:text-lg">{book.book}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-2">
            NEW TESTAMENT
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {newTestamentBooks.map((book) => (
              <div
                key={book.bookCode}
                className={`bg-gray-200 p-4 flex flex-col sm:flex-row justify-between sm:justify-start items-center text-center sm:text-left gap-1 cursor-pointer hover:bg-gray-300 ${
                  selectedBook?.value.toLowerCase() ===
                  book.bookCode.toLowerCase()
                    ? "bg-gray-300 border-2 border-gray-400"
                    : ""
                }`}
                onClick={() =>
                  handleBookSelect(
                    book.bookCode,
                    book.book,
                    book.bookId,
                    book.filename
                  )
                }
              >
                {book.filename ? (
                  <img
                    src={`/books/${book.filename}`}
                    alt={book.book}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12"></div>
                )}
                <span className="text-sm sm:text-lg">{book.book}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          className={`border border-gray-300 p-2 rounded cursor-pointer ${
            activeDropdown === "grid" ? "bg-gray-600 text-gray-200" : ""
          }`}
          onClick={() => toggleDropdown("grid")}
          ref={gridButtonRef}
        >
          <LayoutGrid size={24} />
        </button>
        <button
          className={`border border-gray-300 p-2 rounded cursor-pointer ${
            activeDropdown === "list" ? "bg-gray-600 text-gray-200" : ""
          }`}
          onClick={() => toggleDropdown("list")}
          ref={listButtonRef}
        >
          <List size={24} />
        </button>
      </div>

      {activeDropdown && (
        <div
          className="absolute right-0 mt-2 w-screen max-w-2xl border border-gray-300 bg-white shadow-lg z-50 p-4"
          ref={dropdownRef}
        >
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <button
              className={`px-18 py-2 border-2 font-semibold cursor-pointer ${
                activeView === "book"
                  ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                  : "bg-white text-[var(--indigo-color)]"
              }`}
              onClick={() => selectView("book")}
            >
              Book
            </button>
            <button
              className={`px-18 py-2 border-2 font-semibold cursor-pointer ${
                activeView === "chapter"
                  ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                  : "bg-white text-[var(--indigo-color)]"
              }`}
              onClick={() => selectView("chapter")}
            >
              Chapter
            </button>
            <button
              className={`px-18 py-2 border-2 font-semibold cursor-pointer ${
                activeView === "verse"
                  ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                  : "bg-white text-[var(--indigo-color)]"
              }`}
              onClick={() => selectView("verse")}
            >
              Verse
            </button>
          </div>

          <div className="border max-w-2xl border-gray-300 p-4 h-[45vh]">
            {activeView === "book" && activeDropdown === "list" && renderBooksListView()}
            {activeView === "book" && activeDropdown === "grid" && renderBooksGridView()}

            {activeView === "chapter" && (
              <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 overflow-y-auto max-h-full h-fit">
                {renderChapters()}
              </div>
            )}

            {activeView === "verse" && (
              <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 overflow-y-auto max-h-full h-fit">
                {renderVerses()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectViewContainer;