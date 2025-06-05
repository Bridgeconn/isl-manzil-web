import { useState, useEffect } from "react";
import Dropdown from "./Dropdown";
import {
  BookOption,
  ChapterOption,
  VerseOption,
  OptionType,
} from "../types/Navigation";
import useBibleStore from "@/store/useBibleStore";

const SelectBoxContainer = () => {
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

  const [chapterOptions, setChapterOptions] = useState<ChapterOption[]>([]);
  const [verseOptions, setVerseOptions] = useState<VerseOption[]>([]);

  // Initialize data
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

  const handleBookChange = (option: OptionType | null) => {
    if (option === null || "bookId" in option) {
      const newBook = option as BookOption | null;
      setBook(newBook);
    }
  };

  const handleChapterChange = (option: OptionType | null) => {
    if (option === null || typeof option.value === "number") {
      const newChapter = option as ChapterOption | null;
      setChapter(newChapter);
    }
  };

  const handleVerseChange = (option: OptionType | null) => {
    if (option === null || typeof option.value === "number") {
      setVerse(option as VerseOption | null);
    }
  };

  const formattedOptionLabel = (
    option: OptionType,
    { context }: { context: string }
  ) => {
    const isBookOption = "bookId" in option;
    const isDisabled = "isDisabled" in option && option.isDisabled;

    if (context === "menu" && isBookOption) {
      return (
        <div
          className="flex items-center gap-2"
          title={isDisabled ? "The videos for this book are not available" : ""}
        >
          {option.image ? (
            <img
              src={option.image}
              alt={option.label}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <div className="w-12 h-12" />
          )}
          <span
            className={isDisabled ? "text-gray-400 cursor-not-allowed" : ""}
          >
            {option.label}
          </span>
        </div>
      );
    }

    if (context === "menu" && !isBookOption) {
      return (
        <span
          className={`block text-center ${
            isDisabled ? "text-gray-400 cursor-not-allowed" : ""
          }`}
          title={
            isDisabled ? "The video for this chapter is not available" : ""
          }
        >
          {option.label}
        </span>
      );
    }

    if (context === "value") {
      return (
        <span className="themed-text text-[var(--indigo-color)] font-semibold">
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
          options={availableData.books}
          value={selectedBook}
          formatOptionLabel={formattedOptionLabel}
          onChange={handleBookChange}
          placeholder={isLoading ? "Loading books..." : "Select Book"}
          zIndex="z-45"
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
        {verseOptions.length !== 0 && (
          <Dropdown
            options={verseOptions}
            value={selectedVerse}
            formatOptionLabel={formattedOptionLabel}
            onChange={handleVerseChange}
            placeholder="Verse"
            zIndex="z-35"
          />
        )}
      </div>
    </div>
  );
};

export default SelectBoxContainer;
