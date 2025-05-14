import { useState, useEffect } from "react";
import Dropdown from "./Dropdown";
import bookCodesData from "../assets/data/book_codes.json";
import versificationData from "../assets/data/versification.json";
import { VersificationData } from "../types/bible";
import { BookOption, ChapterOption, VerseOption, OptionType, SelectBoxContainerProps } from "../types/Navigation"

const SelectBoxContainer = ({ onSelectionChange }: SelectBoxContainerProps) => {
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterOption | null>(
    null
  );
  const [selectedVerse, setSelectedVerse] = useState<VerseOption | null>(null);

  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [chapterOptions, setChapterOptions] = useState<ChapterOption[]>([]);
  const [verseOptions, setVerseOptions] = useState<VerseOption[]>([]);

  const typedVersificationData = versificationData as VersificationData;

  useEffect(() => {
    const formattedBooks = bookCodesData.map((book) => ({
      value: book.bookCode,
      label: book.book,
      bookId: book.bookId,
      image: book?.filename ? "/books/" + book?.filename : "",
    }));

    setBookOptions(formattedBooks);
    if (formattedBooks.length > 0) {
      setSelectedBook(formattedBooks[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedBook) {
      const maxChapters =
        typedVersificationData.maxVerses[selectedBook.value.toUpperCase()]
          ?.length || 0;
      const chapters: ChapterOption[] = Array.from(
        { length: maxChapters },
        (_, i) => ({
          value: i + 1,
          label: `${i + 1}`,
        })
      );

      setChapterOptions(chapters);
      if (chapters.length > 0) {
        setSelectedChapter(chapters[0]);
      }
    } else {
      setChapterOptions([]);
    }
  }, [selectedBook]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      const bookCode = selectedBook.value.toUpperCase();
      const chapterIndex = selectedChapter.value - 1;

      const maxVerses =
        typedVersificationData.maxVerses[bookCode]?.[chapterIndex] || "0";
      const verses: VerseOption[] = Array.from(
        { length: parseInt(maxVerses) },
        (_, i) => ({
          value: i + 1,
          label: `${i + 1}`,
        })
      );

      setVerseOptions(verses);
      if (verses.length > 0) {
        setSelectedVerse(verses[0]);
      }
    } else {
      setVerseOptions([]);
    }
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    if (onSelectionChange && selectedBook && selectedChapter && selectedVerse) {
      onSelectionChange(selectedBook, selectedChapter, selectedVerse);
    }
  }, [selectedBook, selectedChapter, selectedVerse, onSelectionChange]);

  const handleBookChange = (option: OptionType | null) => {
    if (option === null || "bookId" in option) {
    setSelectedBook(option as BookOption | null);
  }
  };

  const handleChapterChange = (option: OptionType | null) => {
    if (option === null || (typeof option.value === 'number')) {
      setSelectedChapter(option as ChapterOption | null);
    }
  };

  const handleVerseChange = (option: OptionType | null) => {
    if (option === null || (typeof option.value === 'number')) {
      setSelectedVerse(option as VerseOption | null);
    }
  };

  const formattedOptionLabel = (
    option: OptionType,
    { context }: { context: string }
  ) => {
    const isBookOption = "bookId" in option;
  
    if (context === "menu" && isBookOption) {
      return (
        <div className="flex items-center gap-2">
          {option.image ? (
            <img
              src={option.image}
              alt={option.label}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <div className="w-12 h-12" />
          )}
          <span>{option.label}</span>
        </div>
      );
    }
  
    if (context === "value") {
      return (
        <span className="text-[var(--indigo-color)] font-semibold">
          {option.label}
        </span>
      );
    }
  
    return <span className="block text-center">{option.label}</span>;
  };
  
  return (
    <div className="w-full flex flex-col md:flex-row gap-4">
      <div className="flex-2 max-w-[220px]">
        <Dropdown
          options={bookOptions}
          value={selectedBook}
          formatOptionLabel={formattedOptionLabel}
          onChange={handleBookChange}
          placeholder="Select Book"
          zIndex="z-50"
        />
      </div>

      <div className="flex-1 max-w-[120px]">
        <Dropdown
          options={chapterOptions}
          value={selectedChapter}
          formatOptionLabel={formattedOptionLabel}
          onChange={handleChapterChange}
          placeholder="Chapter"
          zIndex="z-40"
        />
      </div>

      <div className="flex-1 max-w-[120px]">
        <Dropdown
          options={verseOptions}
          value={selectedVerse}
          formatOptionLabel={formattedOptionLabel}
          onChange={handleVerseChange}
          placeholder="Verse"
          zIndex="z-30"
        />
      </div>
    </div>
  );
};

export default SelectBoxContainer;
