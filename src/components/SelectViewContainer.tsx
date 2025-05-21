import { useState, useEffect, useRef } from "react";
import bookCodesData from "../assets/data/book_codes.json";
import versificationData from "../assets/data/versification.json";
import { VersificationData, Book } from "../types/bible";

import useBibleStore from "@/store/useBibleStore";
import { List } from "lucide-react";

type ViewType = "book" | "chapter" | "verse";

const SelectViewContainer = () => {
  const {
    selectedBook,
    selectedChapter,
    selectedVerse,
    setBook,
    setChapter,
    setVerse,
  } = useBibleStore();

  const [isListViewOpen, setIsListViewOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ViewType>("book");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const typedVersificationData = versificationData as VersificationData;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isListViewOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsListViewOpen(false);
      }
    };
    if (isListViewOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isListViewOpen]);

  const toggleListView = () => {
    setIsListViewOpen(!isListViewOpen);
    if (!isListViewOpen) {
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
    setIsListViewOpen(false);
  };

  const oldTestamentBooks = bookCodesData.filter((book) => book.bookId <= 39);
  const newTestamentBooks = bookCodesData.filter((book) => book.bookId >= 40);
  
  oldTestamentBooks.sort((a, b) => a.bookId - b.bookId);
  newTestamentBooks.sort((a, b) => a.bookId - b.bookId);

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

  const renderBookGrid = (books: Book[]) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 w-full">
        {books.map((book: Book) => (
          <div
            key={book.bookCode}
            className={`bg-gray-200 h-14 flex items-center sm:justify-center gap-2 cursor-pointer hover:bg-gray-300 ${
              selectedBook?.value.toLowerCase() === book.bookCode.toLowerCase()
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
                className="w-10 h-10 object-contain"
              />
            ) : (
              <div className="w-10 h-10"></div>
            )}
            <span className="text-sm sm:text-lg text-center">{book.book}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        className={`border border-gray-300 p-2 rounded ${
          isListViewOpen ? "bg-gray-600 text-gray-200" : ""
        }`}
        onClick={toggleListView}
        ref={buttonRef}
      >
        <List size={24} />
      </button>

      {isListViewOpen && (
        <div
          className="absolute -right-2 mt-2 mx-auto max-w-6xl h-[calc(100vh-164px)] overflow-y-auto w-screen border border-gray-300 bg-white shadow-lg z-50"
          ref={dropdownRef}
        >
          <div className="flex flex-col sm:flex-row justify-center mb-2 border-1">
            <button
              className={`px-18 py-2  border-2 font-semibold ${
                activeView === "book"
                  ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                  : "bg-white text-[var(--indigo-color)]"
              }`}
              onClick={() => selectView("book")}
            >
              Book
            </button>
            <button
              className={`px-18 py-2 border-2 font-semibold ${
                activeView === "chapter"
                  ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                  : "bg-white text-[var(--indigo-color)]"
              }`}
              onClick={() => selectView("chapter")}
            >
              Chapter
            </button>
            <button
              className={`px-18 py-2 border-2 font-semibold ${
                activeView === "verse"
                  ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                  : "bg-white text-[var(--indigo-color)]"
              }`}
              onClick={() => selectView("verse")}
            >
              Verse
            </button>
          </div>

          <div>
            {activeView === "book" && (
              <div className="flex overflow-y-auto max-h-full h-fit gap-4 p-2">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-center mb-2">
                    OLD TESTAMENT
                  </h3>
                  {renderBookGrid(oldTestamentBooks)}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-center mb-2">
                    NEW TESTAMENT
                  </h3>
                  {renderBookGrid(newTestamentBooks)}
                </div>
              </div>
            )}

            {activeView === "chapter" && (
              <div className="grid grid-cols-10 gap-1 overflow-y-auto max-h-full h-fit">
                {renderChapters()}
              </div>
            )}

            {activeView === "verse" && (
              <div className="grid grid-cols-10 gap-1 overflow-y-auto max-h-full h-fit">
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