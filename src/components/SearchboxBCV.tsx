import React, { useState, useRef, useEffect } from "react";
import { matchSorter } from "match-sorter";
import useBibleStore from "@/store/useBibleStore";
import BookData from "../assets/data/book_codes.json";
import { VerseOption } from "@/types/Navigation";
import { Search, X } from "lucide-react";
import SearchboxTooltip from "./SearchboxToolTip";

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
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const errorMsg =
    "Invalid search format\nPlease try the following:\nJohn 3:16 or psa 1";

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
      const isInputFocused = document.activeElement === inputRef.current;

      if (isInputFocused && event.key !== "Enter") {
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        if (errorMessage) {
          setErrorMessage("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [errorMessage]);

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
        error: errorMsg,
      };
    }

    let cleanInput = input.trim();

    if (cleanInput.includes(":")) {
      cleanInput = cleanInput.replace(/\s*:\s*/g, ":");
      const colonParts = cleanInput.split(":");

      if (colonParts.length !== 2) {
        return {
          error: errorMsg,
        };
      }

      const bookAndChapter = colonParts[0];
      const verseStr = colonParts[1].trim();
      const verseNum = verseStr !== "Intro" ? parseInt(verseStr, 10) : 0;

      if (isNaN(verseNum)) {
        return {
          error: errorMsg,
        };
      }

      const parts = bookAndChapter.trim().split(/\s+/);

      if (parts.length < 2) {
        return {
          error: errorMsg,
        };
      }

      const chapterStr = parts[parts.length - 1];
      const chapterNum = chapterStr !== "Intro" ? parseInt(chapterStr, 10) : 0;

      if (isNaN(chapterNum)) {
        return {
          error: errorMsg,
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
        error: errorMsg,
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
          error: errorMsg,
        };
      }
    } else {
      return {
        error: errorMsg,
      };
    }

    const chapterNum = chapterStr !== "Intro" ? parseInt(chapterStr, 10) : 0;
    if (isNaN(chapterNum)) {
      return {
        error: errorMsg,
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

    if (!foundChapter || foundChapter.isDisabled) {
      const chapterMsg = `${book.label} ${chapter} isn't available yet`;
      setErrorMessage(chapterMsg);
      return false;
    }

    if (verse !== null) {
      const availableVerses = await getAvailableVersesForBookAndChapter(
        book.value,
        chapter
      );
      const foundVerse = findVerseInAvailableVerses(availableVerses, verse);
      if (!foundVerse) {
        setErrorMessage("Verse not found");
        return false;
      }
    }

    const isBookChange = !selectedBook || selectedBook.value !== book.value;
    const isChapterChange =
      !selectedChapter || selectedChapter.value !== chapter;

    if (isBookChange) {
      setBook(book);
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
          book.value,
          chapter
        );
        const foundVerse = findVerseInAvailableVerses(availableVerses, verse);

        if (foundVerse) {
          setVerse(foundVerse);
          setCurrentPlayingVerse(foundVerse.label);
          setErrorMessage("");
        }
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

  function shouldShowBookSuggestions(input: string): boolean {
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);

    // Case 1: Single word like "John", "Gen", "1"
    if (parts.length === 1) {
      return /^[1-3]?[a-z]*$/i.test(parts[0]);
    }

    // Case 2: Two words like "1 John", "2 Tim"
    if (parts.length === 2) {
      const [first, second] = parts;
      console.log(first, second);
      return isNaN(Number(second));
    }

    return false;
  }

  function hasSelectedBook(input: string): boolean {
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);

    if (parts.length >= 2) {
      const bookPart = parts.slice(0, -1).join(" ");
      const found = findBook(bookPart);
      return !!found;
    }

    if (parts.length === 1) {
      const found = findBook(parts[0]);
      return !!found && input.endsWith(" ");
    }

    return false;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (errorMessage) setErrorMessage("");

    if (!hasSelectedBook(value) && shouldShowBookSuggestions(value)) {
      const searchTerm = value.trim().match(/^([1-3]?\s?[a-z]*)/i)?.[0] ?? "";

      if (searchTerm.length > 0) {
        const results = matchSorter(availableData.books, searchTerm, {
          keys: ["label"],
        }).slice(0, 5);

        setSuggestions(results.map((r) => r.label));
        setShowSuggestions(true);
        return;
      }
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion + " ");
    setSuggestions([]);
    setShowSuggestions(false);
    setTimeout(() => {
      inputRef.current?.focus();
      setIsFocused(true);
      setIsHovered(true);
    }, 0);
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
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 150);
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      setErrorMessage(errorMsg);
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
      <div
        className="max-w-[250px] w-full bg-white overflow-hidden rounded-full"
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.2) 0px 4px 6px -1px," +
            "rgba(0, 0, 0, 0.14) 0px 2px 4px 0px," +
            "rgba(0, 0, 0, 0.12) 0px -1px 4px 0px",
          transition: "box-shadow 0.3s ease-in-out",
        }}
      >
        <div
          className="flex items-center p-2 px-4 gap-1 relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 outline-none bg-transparent min-w-0 overflow-hidden text-ellipsis"
            disabled={isSearching}
          />

          <div className="flex items-center gap-1 flex-shrink-0">
            {inputValue && (
              <button
                onClick={handleClear}
                className="text-gray-600 hover:text-gray-800 text-xs p-1 flex-shrink-0"
                title="Clear"
                disabled={isSearching}
              >
                <X strokeWidth={2.5} size={20} />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="text-blue-700 hover:text-blue-900 text-xs p-1 disabled:opacity-50 flex-shrink-0"
              title="Search"
              disabled={isSearching || !inputValue.trim()}
            >
              {isSearching ? "⏳" : <Search strokeWidth={2.5} size={18} />}
            </button>
          </div>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 text-sm max-h-52 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onMouseDown={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      {!showSuggestions &&
        (isHovered || isFocused) &&
        hasSelectedBook(inputValue) && <SearchboxTooltip />}

      {errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-300 rounded-md shadow-lg z-50 p-2 text-xs">
          {errorMessage.split("\n").map((line, idx) => (
            <div
              key={idx}
              className={`themed-text text-themed font-medium ${
                idx === 0 && line === "Invalid search format"
                  ? "font-semibold"
                  : ""
              }`}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchboxBCV;
