import React, { useState, useRef, useEffect } from "react";
import useBibleStore from "@/store/useBibleStore";
import BookData from "../assets/data/book_codes.json";
import { VerseOption } from "@/types/Navigation";

interface SearchboxBCVProps {
  placeholder?: string;
  className?: string;
}

const verseUtils = {
  normalizeVerse: (verse: string | number) => {
    return verse.toString().includes("-")
      ? verse.toString().replace("-", "_")
      : verse.toString();
  },

  parseVerseRange: (verseLabel: string | number) => {
    const label = verseLabel.toString();


    if (/^\d+$/.test(label)) {
      const num = parseInt(label);
      return { start: num, end: num, isSingle: true };
    }


    const rangeMatch = label.match(/^(\d+)[-_](\d+)$/);
    if (rangeMatch) {
      return {
        start: parseInt(rangeMatch[1]),
        end: parseInt(rangeMatch[2]),
        isSingle: false,
      };
    }

    return null;
  },

  isVerseInRange: (
    targetVerse: string | number,
    verseLabel: string | number
  ) => {
    const range = verseUtils.parseVerseRange(verseLabel);
    if (!range) return false;

    const target = parseInt(targetVerse.toString());
    if (isNaN(target)) return false;

    return target >= range.start && target <= range.end;
  },
};

function SearchboxBCV({
  placeholder = "Search Bible Reference",
  className = "",
}: SearchboxBCVProps) {
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    availableData,
    selectedBook,
    selectedChapter,
    setBook,
    setChapter,
    setVerse,
    getAvailableChaptersForBook,
    getAvailableVersesForBookAndChapter,
    setCurrentPlayingVerse,
  } = useBibleStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        isFocused &&
        (event.key === " " ||
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight")
      ) {
        event.stopPropagation();
      }
    };

    if (isFocused) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [isFocused]);

  const findBook = (searchTerm: string) => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    const mappedBookName = BookData.find(
      (book) =>
        book.book.toLowerCase() === lowerSearchTerm ||
        book.bookCode.toLowerCase() === lowerSearchTerm
    );

    if (mappedBookName) {
      return availableData.books.find(
        (book) => book.label.toLowerCase() === mappedBookName.book.toLowerCase()
      );
    }

    return availableData.books.find(
      (book) =>
        book.label.toLowerCase() === lowerSearchTerm ||
        book.value.toLowerCase() === lowerSearchTerm
    );
  };

  const findVerseInAvailableVerses = (
    availableVerses: VerseOption[],
    targetVerse: string
  ) => {
    return availableVerses.find((v) => {
      const normalizedVerseValue = verseUtils.normalizeVerse(
        v.value.toString()
      );
      const normalizedVerseLabel = verseUtils.normalizeVerse(v.label);
      targetVerse = verseUtils.normalizeVerse(targetVerse);
      if (
        normalizedVerseLabel.toLowerCase() === targetVerse.toLowerCase() ||
        normalizedVerseValue === targetVerse
      ) {
        return true;
      }

      return verseUtils.isVerseInRange(targetVerse, v.label);
    });
  };

  const parseBCV = (input: string) => {
    if (!input || input.trim() === "") {
      return {
        error: "Invalid format use the following format John 3:16 or psa 1",
      };
    }

    let cleanInput = input.trim();

    if (cleanInput.includes(":")) {
      cleanInput = cleanInput.replace(/\s*:\s*/g, ":");
      const colonParts = cleanInput.split(":");

      if (colonParts.length !== 2) {
        return {
          error: "Invalid format use the following format John 3:16 or psa 1",
        };
      }

      const bookAndChapter = colonParts[0];
      const verseStr = colonParts[1].trim();
      const verseNum = verseStr !== "Intro" ? parseInt(verseStr, 10) : 0;

      if (isNaN(verseNum)) {
        return {
          error: "Invalid format use the following format John 3:16 or psa 1",
        };
      }

      const parts = bookAndChapter.trim().split(/\s+/);

      if (parts.length < 2) {
        return {
          error: "Invalid format use the following format John 3:16 or psa 1",
        };
      }

      const chapterStr = parts[parts.length - 1];
      const chapterNum = chapterStr !== "Intro" ? parseInt(chapterStr, 10) : 0;

      if (isNaN(chapterNum)) {
        return {
          error: "Invalid format use the following format John 3:16 or psa 1",
        };
      }

      const bookParts = parts.slice(0, -1);
      const bookStr = bookParts.join(" ");

      const foundBook = findBook(bookStr);

      if (!foundBook) {
        return { error: "Book not found" };
      }

      return {
        book: foundBook,
        chapter: chapterNum,
        verse: verseNum,
        isValid: true,
      };
    }

    const parts = cleanInput.split(/\s+/);

    if (parts.length < 2) {
      return {
        error: "Invalid format use the following format John 3:16 or psa 1",
      };
    }

    let bookStr: string;
    let chapterStr: string;
    let verseStr: string | null = null;

    // Handle different cases based on number of parts
    if (parts.length === 2) {
      bookStr = parts[0];
      chapterStr = parts[1];
    } else if (parts.length === 3) {
      const firstPart = parts[0];
      const secondPart = parts[1];
      const thirdPart = parts[2];

      if (/^\d+$/.test(firstPart) && !/^\d+$/.test(secondPart)) {
        bookStr = `${firstPart} ${secondPart}`;
        chapterStr = thirdPart;
      } else {
        bookStr = firstPart;
        chapterStr = secondPart;
        verseStr = thirdPart;
      }
    } else if (parts.length === 4) {
      const firstPart = parts[0];
      const secondPart = parts[1];
      const thirdPart = parts[2];
      const fourthPart = parts[3];

      if (/^\d+$/.test(firstPart)) {
        bookStr = `${firstPart} ${secondPart}`;
        chapterStr = thirdPart;
        verseStr = fourthPart;
      } else {
        return {
          error: "Invalid format use the following format John 3:16 or psa 1",
        };
      }
    } else {
      return {
        error: "Invalid format use the following format John 3:16 or psa 1",
      };
    }

    const chapterNum = chapterStr !== "Intro" ? parseInt(chapterStr, 10) : 0;
    if (isNaN(chapterNum)) {
      return {
        error: "Invalid format use the following format John 3:16 or psa 1",
      };
    }

    let verseNum: string | null = null;
    if (verseStr) {
      verseNum = verseStr !== "Intro" ? verseStr : "0";
    }

    const foundBook = findBook(bookStr);

    if (!foundBook) {
      return { error: "Book not found" };
    }

    return {
      book: foundBook,
      chapter: chapterNum,
      verse: verseNum,
      isValid: true,
    };
  };

  const validateAndNavigate = async (parseResult: any) => {
    if (!parseResult.isValid) {
      setErrorMessage(parseResult.error);
      return false;
    }

    const { book, chapter, verse } = parseResult;

    const availableChapters = getAvailableChaptersForBook(book.value);
    const foundChapter = availableChapters.find((ch) => ch.value === chapter);

    if (!foundChapter) {
      setErrorMessage("Chapter not found");
      return false;
    }

    if (foundChapter.isDisabled) {
      setErrorMessage("Chapter not found");
      return false;
    }

    const isBookChange = !selectedBook || selectedBook.value !== book.value;
    const isChapterChange =
      !selectedChapter || selectedChapter.value !== chapter;

    if (isBookChange) {
      setBook(book);
    }

    if (isChapterChange) {
      setChapter(foundChapter);
    }

    if (verse !== null) {
      const delay = isBookChange ? 800 : isChapterChange ? 500 : 150;
      setTimeout(() => {
        const availableVerses = getAvailableVersesForBookAndChapter(
          book.value,
          chapter
        );
        const foundVerse = findVerseInAvailableVerses(availableVerses, verse);

        if (!foundVerse) {
          setErrorMessage("Verse not found");
          return;
        }

        setVerse(foundVerse);
        setCurrentPlayingVerse(foundVerse.label);
        setErrorMessage("");
      }, delay);
    } else {
      setErrorMessage("");
    }

    setInputValue("");
    if (inputRef.current) {
      inputRef.current.blur();
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      setErrorMessage(
        "Invalid format use the following format John 3:16 or psa 1"
      );
      return;
    }

    setIsSearching(true);
    setErrorMessage("");

    try {
      const parseResult = parseBCV(inputValue);
      await validateAndNavigate(parseResult);
    } catch (error) {
      console.error("Search error:", error);
      setErrorMessage("An error occurred while searching");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setErrorMessage("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="max-w-[200px] w-full border border-gray-400 rounded-md bg-white overflow-hidden">
        <div className="flex items-center p-2 gap-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 outline-none text-sm bg-transparent min-w-0 overflow-hidden text-ellipsis"
            disabled={isSearching}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            {inputValue && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 text-xs p-1 flex-shrink-0"
                title="Clear"
                disabled={isSearching}
              >
                ✕
              </button>
            )}
            <button
              onClick={handleSearch}
              className="text-blue-600 hover:text-blue-800 text-xs p-1 disabled:opacity-50 flex-shrink-0"
              title="Search"
              disabled={isSearching || !inputValue.trim()}
            >
              {isSearching ? "⏳" : "🔍"}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-300 rounded-md shadow-lg z-50 p-2 text-xs">
          <div className="text-red-600 font-medium">{errorMessage}</div>
        </div>
      )}
    </div>
  );
}

export default SearchboxBCV;
