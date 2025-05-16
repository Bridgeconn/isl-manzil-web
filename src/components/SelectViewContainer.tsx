import { useState, useEffect, useRef } from "react";
import bookCodesData from "../assets/data/book_codes.json";
import versificationData from "../assets/data/versification.json";
import { VersificationData } from "../types/bible";
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
          className="absolute right-0 mt-2 w-screen max-w-2xl border border-gray-300 bg-white shadow-lg z-50 p-4"
          ref={dropdownRef}
        >
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
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

          <div className="border max-w-2xl border-gray-300 p-4 h-[45vh]">
            {activeView === "book" && (
              <div className="flex gap-4 overflow-y-auto h-full">
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
            )}

            {activeView === "chapter" && (
              <div className="grid grid-cols-9 gap-2 overflow-y-auto h-fit">
                {renderChapters()}
              </div>
            )}

            {activeView === "verse" && (
              <div className="grid grid-cols-9 gap-2 overflow-y-auto h-fit">
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
