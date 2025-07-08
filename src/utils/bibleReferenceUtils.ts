import { BookOption, VerseOption } from "@/types/Navigation";
import BookData from "@/assets/data/book_codes.json";

export const verseUtils = {
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

  isVerseInRange: (targetVerse: string | number, verseLabel: string | number) => {
    const range = verseUtils.parseVerseRange(verseLabel);
    if (!range) return false;

    const target = parseInt(targetVerse.toString());
    if (isNaN(target)) return false;

    return target >= range.start && target <= range.end;
  },
};

export function findBook(searchTerm: string, availableBooks: BookOption[]): BookOption | undefined {
  const lowerSearchTerm = searchTerm.toLowerCase();

  const mappedBook = BookData.find(
    (book) =>
      book.book.toLowerCase() === lowerSearchTerm ||
      book.bookCode.toLowerCase() === lowerSearchTerm
  );

  if (mappedBook) {
    return availableBooks.find(
      (book) => book.label.toLowerCase() === mappedBook.book.toLowerCase()
    );
  }

  return availableBooks.find(
    (book) =>
      book.label.toLowerCase() === lowerSearchTerm ||
      book.value.toLowerCase() === lowerSearchTerm
  );
}

export function findVerseInAvailableVerses(
  availableVerses: VerseOption[],
  targetVerse: string
): VerseOption | undefined {
  const normalizedTarget = verseUtils.normalizeVerse(targetVerse);
  return availableVerses.find((v) => {
    const label = verseUtils.normalizeVerse(v.label);
    const value = verseUtils.normalizeVerse(v.value.toString());

    return (
      label.toLowerCase() === normalizedTarget.toLowerCase() ||
      value === normalizedTarget ||
      verseUtils.isVerseInRange(normalizedTarget, v.label)
    );
  });
}

export function parseBibleReference(
  input: string,
  availableBooks: BookOption[]
): {
  book?: BookOption;
  chapter?: number;
  verse?: string | number | null;
  isValid?: boolean;
  error?: string;
} {
  if (!input || input.trim() === "") {
    return { error: "Invalid format use the following format John 3:16 or psa 1" };
  }

  let cleanInput = input.trim();

  if (cleanInput.includes(":")) {
    cleanInput = cleanInput.replace(/\s*:\s*/g, ":");
    const colonParts = cleanInput.split(":");
    if (colonParts.length !== 2) return { error: "Invalid format use the following format John 3:16 or psa 1" };

    const bookAndChapter = colonParts[0];
    const verseStr = colonParts[1].trim();
    const verseNum = verseStr !== "Intro" ? parseInt(verseStr, 10) : 0;
    if (isNaN(verseNum)) return { error: "Invalid verse number" };

    const parts = bookAndChapter.trim().split(/\s+/);
    if (parts.length < 2) return { error: "Invalid format use the following format John 3:16 or psa 1" };

    const chapterStr = parts[parts.length - 1];
    const chapterNum = chapterStr !== "Intro" ? parseInt(chapterStr, 10) : 0;
    if (isNaN(chapterNum)) return { error: "Invalid chapter number" };

    const bookStr = parts.slice(0, -1).join(" ");
    const foundBook = findBook(bookStr, availableBooks);
    if (!foundBook) return { error: "Book not found" };

    return {
      book: foundBook,
      chapter: chapterNum,
      verse: verseNum,
      isValid: true,
    };
  }

  const parts = cleanInput.split(/\s+/);
  if (parts.length < 2) return { error: "Invalid format use the following format John 3:16 or psa 1" };

  let bookStr = parts[0];
  let chapterStr = parts[1];
  let verseStr: string | null = null;

  if (parts.length === 3) {
    const first = parts[0];
    const second = parts[1];
    const third = parts[2];

    if (/^\d+$/.test(first) && !/^\d+$/.test(second)) {
      bookStr = `${first} ${second}`;
      chapterStr = third;
    } else {
      bookStr = first;
      chapterStr = second;
      verseStr = third;
    }
  } else if (parts.length === 4) {
    if (/^\d+$/.test(parts[0])) {
      bookStr = `${parts[0]} ${parts[1]}`;
      chapterStr = parts[2];
      verseStr = parts[3];
    } else {
      return { error: "Invalid format use the following format John 3:16 or psa 1" };
    }
  }

  const chapterNum = chapterStr !== "Intro" ? parseInt(chapterStr, 10) : 0;
  if (isNaN(chapterNum)) return { error: "Invalid chapter" };
  let verseNum: string | null = null;
    if (verseStr) {
      verseNum = verseStr !== "Intro" ? verseStr : "0";
    }
  const foundBook = findBook(bookStr, availableBooks);
  if (!foundBook) return { error: "Book not found" };

  return {
    book: foundBook,
    chapter: chapterNum,
    verse: verseNum,
    isValid: true,
  };
}
