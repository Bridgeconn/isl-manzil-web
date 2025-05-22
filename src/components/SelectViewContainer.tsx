import { useState } from "react";
import bookCodesData from "../assets/data/book_codes.json";
import versificationData from "../assets/data/versification.json";
import { VersificationData, Book } from "../types/bible";
import useBibleStore from "@/store/useBibleStore";

import { List, LayoutGrid, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("book");
  const [viewMode, setViewMode] = useState<DropdownType>("grid");

  const typedVersificationData = versificationData as VersificationData;

  const openDialog = (type: DropdownType) => {
    setViewMode(type);
    setIsDialogOpen(true);
    setActiveView("book");
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
    setIsDialogOpen(false);
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
            className={`bg-gray-200 h-12 flex items-center justify-center flex-wrap cursor-pointer hover:bg-gray-300 ${
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
            className={`bg-gray-200 h-12 flex items-center flex-wrap justify-center cursor-pointer hover:bg-gray-300 ${
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
      <div
        className={`grid ${
          viewMode === "list"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
        } gap-1 w-full`}
      >
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
            <span className="text-sm sm:text-lg sm:text-center">
              {book.book}
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
      <div className="flex gap-2">
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
                }`}
                onClick={() => selectedBook && setActiveView("chapter")}
              >
                Chapter
              </button>
              <button
                className={`px-4 py-2 font-semibold cursor-pointer flex-1 border-2 sm:rounded-tr-lg sm:rounded-tl-lg ${
                  activeView === "verse"
                    ? "bg-[var(--indigo-color)] text-white border-[var(--indigo-color)]"
                    : "bg-white text-[var(--indigo-color)]"
                }`}
                onClick={() =>
                  selectedBook && selectedChapter && setActiveView("verse")
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