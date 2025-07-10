import { create } from "zustand";
import { BookOption, ChapterOption, VerseOption } from "../types/Navigation";
import Papa from "papaparse";
import bookCodesData from "../assets/data/book_codes.json";
import versificationData from "../assets/data/versification.json";
import { VersificationData } from "../types/bible";

const videoLinksData = new URL(
  "../assets/data/isl_video_urls.csv",
  import.meta.url
).href;

interface VideoLinkRowData {
  BookCode: string;
  Chapter: string;
  VideoId: number;
}

interface AvailableData {
  books: BookOption[];
  chapters: { [bookCode: string]: ChapterOption[] };
}

export interface VerseMarkerType {
  id: number;
  verse: string;
  time: string;
}

interface AvailableData {
  books: BookOption[];
  chapters: { [bookCode: string]: ChapterOption[] };
}

interface BibleStore {
  selectedBook: BookOption | null;
  selectedChapter: ChapterOption | null;
  selectedVerse: VerseOption | null;
  currentVideoId: number | null;
  availableData: AvailableData;
  bibleVerseMarker: VerseMarkerType[] | null;
  currentPlayingVerse: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  seekToVerse: (verse: string) => void;
  isVideoLoading: boolean;
  // Add request tracking
  currentLoadingRequest: string | null;
  isManualVerseSelection: boolean;

  setBook: (book: BookOption | null) => void;
  setChapter: (chapter: ChapterOption | null, shouldSetFirstVerse?: boolean) => void;
  setVerse: (verse: VerseOption | null) => void;
  setCurrentVideoId: (videoId: number | null) => void;
  setCurrentPlayingVerse: (verse: string | null) => void;
  getCurrentVerseFromTime: (currentTime: number) => string | null;
  getVideoUrlData: () => Promise<VideoLinkRowData[] | null>;
  initializeAvailableData: () => Promise<void>;
  getAvailableChaptersForBook: (bookCode: string) => ChapterOption[];
  getAvailableVersesForBookAndChapter: (
    bookCode: string,
    chapter: number
  ) => Promise<VerseOption[]>;
  getVideoIdByBookAndChapter: (
    book: string,
    chapter: number
  ) => Promise<number | null>;
  loadVideoForCurrentSelection: () => void;
  getBibleVerseMarker: () => Promise<VerseMarkerType[] | null>;
  getBibleVerseMarkerForBookAndChapter: (
    bookLabel: string,
    chapter: number
  ) => Promise<VerseMarkerType[] | null>;
  findVerseMarkerForVerse: (verseNumber: number) => Promise<VerseMarkerType | null>;
  isVerseInRange: (verseNumber: number, verseRange: string) => boolean;
}

const typedVersificationData = versificationData as VersificationData;

const useBibleStore = create<BibleStore>((set, get) => ({
  selectedBook: null,
  selectedChapter: null,
  selectedVerse: null,
  currentVideoId: null,
  currentPlayingVerse: null,
  isLoading: false,
  isInitialized: false,
  isVideoLoading: false,
  availableData: {
    books: [],
    chapters: {},
  },
  bibleVerseMarker: [],
  currentLoadingRequest: null,
  isManualVerseSelection: false,

  // Helper function to check if a verse number is within a verse range
  isVerseInRange: (verseNumber: number, verseRange: string): boolean => {
    const trimmedRange = verseRange.trim();
    // If it's a single verse (no dash), check for exact match
    if (!trimmedRange.includes("-")) {
      if (verseRange === "Intro" && verseNumber === 0) {
        return true;
      }
      return parseInt(trimmedRange) === verseNumber;
    }

    // If it's a range (contains dash), check if verse is within the range
    const rangeParts = trimmedRange.split("-");
    if (rangeParts.length === 2) {
      const startVerse = parseInt(rangeParts[0].trim());
      const endVerse = parseInt(rangeParts[1].trim());

      if (!isNaN(startVerse) && !isNaN(endVerse)) {
        return verseNumber >= startVerse && verseNumber <= endVerse;
      }
    }

    return false;
  },

  // Helper function to find verse marker for a specific verse number
  findVerseMarkerForVerse: async (verseNumber: number): Promise<VerseMarkerType | null> => {
    const bibleVerseMarker = await get().getBibleVerseMarkerForBookAndChapter(get().selectedBook!.label, get().selectedChapter!.value);
    if (!bibleVerseMarker || bibleVerseMarker.length === 0) {
      return null;
    }

    // Find the marker that contains this verse number
    return (
      bibleVerseMarker.find((marker) =>
        get().isVerseInRange(verseNumber, marker.verse)
      ) || null
    );
  },

  setBook: (book: BookOption | null) => {
    set({ selectedBook: book, currentPlayingVerse: null });

    // Auto-set first available chapter when book changes
    if (book) {
      const availableChapters = get().getAvailableChaptersForBook(book.value);
      if (availableChapters.length > 0) {
        get().setChapter(availableChapters[0]);
      } else {
        get().setChapter(null);
      }
    } else {
      get().setChapter(null);
    }
  },

  setChapter: async (chapter: ChapterOption | null, shouldSetFirstVerse: boolean = true) => {
    set({
      selectedChapter: chapter,
      currentPlayingVerse: null,
      bibleVerseMarker: [],
    });

    // Auto-set first verse when chapter changes
    if (shouldSetFirstVerse && chapter && get().selectedBook) {
      const availableVerses = await get().getAvailableVersesForBookAndChapter(
        get().selectedBook!.value,
        chapter.value
      );
      if (availableVerses.length > 0) {
        get().setVerse(availableVerses[0]);
      } else {
        get().setVerse(null);
      }
    }
  },

  setVerse: (verse: VerseOption | null) => {
    set({
      selectedVerse: verse,
      isManualVerseSelection: true,
    });

    setTimeout(() => {
      set({ isManualVerseSelection: false });
    }, 3000);
  },
  setCurrentVideoId: (videoId: number | null) =>
    set({ currentVideoId: videoId }),
  setCurrentPlayingVerse: (verse: string | null) =>
    set({ currentPlayingVerse: verse }),

  getCurrentVerseFromTime: (currentTime: number): string | null => {
    const { bibleVerseMarker } = get();

    if (!bibleVerseMarker || bibleVerseMarker.length === 0) {
      return null;
    }

    const timeToSeconds = (timeStr: string): number => {
      if (!timeStr) return 0;
      const parts = timeStr.split(":");

      if (parts.length === 3 || parts.length === 4) {
        return (
          parseInt(parts[0]) * 3600 +
          parseInt(parts[1]) * 60 +
          parseInt(parts[2])
        );
      } else if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else {
        return parseInt(parts[0]);
      }
    };

    // Convert verse markers to seconds and sort by time
    const sortedMarkers = bibleVerseMarker
      .map((marker) => ({
        ...marker,
        timeInSeconds: timeToSeconds(marker.time),
      }))
      .sort((a, b) => a.timeInSeconds - b.timeInSeconds);

    let currentVerse = null;

    for (let i = 0; i < sortedMarkers.length; i++) {
      const currentMarker = sortedMarkers[i];
      const nextMarker = sortedMarkers[i + 1];

      if (currentTime >= currentMarker.timeInSeconds) {
        // If there's no next marker, or current time is before next marker
        if (!nextMarker || currentTime < nextMarker.timeInSeconds) {
          currentVerse = currentMarker.verse;
          break;
        }
      }
    }

    return currentVerse;
  },

  getVideoUrlData: async (): Promise<VideoLinkRowData[] | null> => {
    try {
      const response = await fetch(videoLinksData);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      const parsedData = await Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      return parsedData.data as VideoLinkRowData[];
    } catch (err) {
      console.error("Failed to fetch", err);
      return null;
    }
  },

  initializeAvailableData: async () => {
    set({ isLoading: true });

    try {
      const videoData = await get().getVideoUrlData();
      if (!videoData) {
        set({ isLoading: false });
        return;
      }

      // Build a map: bookCode -> array of chapters
      const bookChapters: { [bookCode: string]: number[] } = {};

      for (const row of videoData) {
        if (row.BookCode && row.Chapter) {
          const bookCode = row.BookCode.toLowerCase();
          const chapter = parseInt(row.Chapter);

          if (!bookChapters[bookCode]) {
            bookChapters[bookCode] = [];
          }
          if (!bookChapters[bookCode].includes(chapter)) {
            bookChapters[bookCode].push(chapter);
          }
        }
      }

      // Sort chapters for each book
      Object.keys(bookChapters).forEach((bookCode) => {
        bookChapters[bookCode].sort((a, b) => a - b);
      });

      // Create book options
      const books = bookCodesData.map((book) => ({
        value: book.bookCode,
        label: book.book,
        bookId: book.bookId,
        image: book?.filename ? "/books/" + book?.filename : "",
        isDisabled: !bookChapters[book.bookCode.toLowerCase()],
      }));

      // Create chapter options
      const chapters: { [bookCode: string]: ChapterOption[] } = {};
      for (const bookCode in bookChapters) {
        chapters[bookCode] = bookChapters[bookCode].map((chapterNum) => ({
          value: chapterNum,
          label: `${chapterNum}`,
          isDisabled: false,
        }));
      }

      // Set available data values
      set({
        availableData: {
          books,
          chapters,
        },
        isLoading: false,
        isInitialized: true,
      });

      // Auto-select first available book
      const firstAvailableBook = books.find((book) => !book.isDisabled);
      if (firstAvailableBook && !get().selectedBook) {
        get().setBook(firstAvailableBook);
      }
    } catch (error) {
      console.error("Error initializing available data:", error);
      set({ isLoading: false });
    }
  },

  getAvailableChaptersForBook: (bookCode: string): ChapterOption[] => {
    const { availableData } = get();
    const lowerBookCode = bookCode.toLowerCase();

    const availableChapters = availableData.chapters[lowerBookCode] || [];

    const maxChapters =
      typedVersificationData.maxVerses[bookCode.toUpperCase()]?.length || 0;

    const allChapters: ChapterOption[] = Array.from(
      { length: maxChapters },
      (_, i) => {
        const chapterNum = i + 1;
        const isAvailable = availableChapters.some(
          (ch) => ch.value === chapterNum
        );

        return {
          value: chapterNum,
          label: `${chapterNum}`,
          isDisabled: !isAvailable,
        };
      }
    );

    const introChapter: ChapterOption = {
      value: 0,
      label: "Intro",
      isDisabled: !availableChapters.some((ch) => ch.value === 0),
    };

    return [introChapter, ...allChapters];
  },

  getBibleVerseMarkerForBookAndChapter: async (
    bookLabel: string,
    chapter: number
  ): Promise<VerseMarkerType[] | null> => {
    if (chapter === 0) {
      return [];
    }

    try {
      const csvFiles = import.meta.glob(
        "/src/assets/data/verse_markers/*.csv",
        {
          query: "?raw",
          import: "default",
        }
      );

      const filePath = `/src/assets/data/verse_markers/${bookLabel}_${chapter}.csv`;

      if (!csvFiles[filePath]) {
        console.warn(
          `Verse marker file not found: ${bookLabel}_${chapter}.csv`
        );
        return [];
      }

      const csvText = (await csvFiles[filePath]()) as string;
      const parsedData = await Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      const formattedVerseMarkerData: VerseMarkerType[] = parsedData.data.map(
        (row: any, index) => {
          return {
            id: index + 1,
            verse: row.verse.toString().trim() || "",
            time: row.time.toString().trim() || "",
          };
        }
      );

      const isIntroAvailable = formattedVerseMarkerData.some((v) =>
        ["00:00:00:00", "00:00:00", "0:00:00"].includes(v.time)
      );

      if (!isIntroAvailable) {
        const introVerse = {
          id: 0,
          verse: "Intro",
          time: "00:00:00:00",
        };
        return [introVerse, ...formattedVerseMarkerData];
      } else {
        return formattedVerseMarkerData;
      }
    } catch (err) {
      console.error(
        `Failed to load verse markers for ${bookLabel}_${chapter}:`,
        err
      );
      return null;
    }
  },

  getAvailableVersesForBookAndChapter: async (
    bookCode: string,
    chapter: number
  ): Promise<VerseOption[]> => {
    const bookCodeUpper = bookCode.toUpperCase();
    const chapterIndex = chapter - 1;

    if (chapterIndex < 0) {
      return [];
    }

    const maxVerses = parseInt(
      typedVersificationData.maxVerses[bookCodeUpper]?.[chapterIndex] || "0"
    );
    const bookData = bookCodesData.find(
      (book) => book.bookCode.toLowerCase() === bookCode.toLowerCase()
    );
    if (!bookData) {
      console.warn(`Book not found for code: ${bookCode}`);
      return [];
    }
    const bibleVerseMarker = await get().getBibleVerseMarkerForBookAndChapter(
      bookData.book,
      chapter
    );
    if (bibleVerseMarker && bibleVerseMarker.length > 0) {
      const verseOptions: VerseOption[] = [];
      const processedVerses = new Set<number>();

      bibleVerseMarker.forEach((marker) => {
        const verseStr = marker.verse.toString().trim();

        if (verseStr === "Intro" || verseStr === "0") {
          return;
        }

        if (verseStr.includes("-") || verseStr.includes("_")) {
          const separator = verseStr.includes("-") ? "-" : "_";
          const [startStr, endStr] = verseStr.split(separator);
          const start = parseInt(startStr.trim());
          const end = parseInt(endStr.trim());

          if (!isNaN(start) && !isNaN(end)) {
            verseOptions.push({
              value: start,
              label: verseStr,
            });

            // Mark all verses in this range as processed
            for (let i = start; i <= end; i++) {
              processedVerses.add(i);
            }
          }
        } else {
          // Single verse
          const verseNum = parseInt(verseStr);
          if (!isNaN(verseNum) && !processedVerses.has(verseNum)) {
            verseOptions.push({
              value: verseNum,
              label: verseStr,
            });
            processedVerses.add(verseNum);
          }
        }
      });

      verseOptions.sort((a, b) => a.value - b.value);

      const hasIntroMarker = bibleVerseMarker.some(
        (marker) =>
          marker.verse.toString().trim() === "Intro" ||
          marker.verse.toString().trim() === "0"
      );

      if (hasIntroMarker) {
        const introVerse: VerseOption = {
          value: 0,
          label: "Intro",
        };
        return [introVerse, ...verseOptions];
      }

      return verseOptions;
    }

    // if no bibleVerseMarker data, fall back to generating all verses
    const verses: VerseOption[] = Array.from({ length: maxVerses }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}`,
    }));

    const introVerse: VerseOption = {
      value: 0,
      label: "Intro",
    };

    return [introVerse, ...verses];
  },

  getVideoIdByBookAndChapter: async (
    book: string,
    chapter: number
  ): Promise<number | null> => {
    try {
      const parsedData = await get().getVideoUrlData();
      if (parsedData) {
        const match = parsedData.find(
          (row) =>
            row.BookCode &&
            row.Chapter &&
            row.BookCode.toLowerCase() === book.toLowerCase() &&
            Number(row.Chapter) === chapter
        );
        return match && match.VideoId ? Number(match.VideoId) : null;
      }
    } catch (err) {
      console.log("Error in getVideoIdByBookAndChapter:", err);
    }
    return null;
  },

  loadVideoForCurrentSelection: async () => {
    const { selectedBook, selectedChapter } = get();
    if (!selectedBook || !selectedChapter) {
      set({
        isVideoLoading: false,
        currentVideoId: null,
        currentLoadingRequest: null,
      });
      return;
    }

    // Create unique request ID to track this specific request
    const requestId = `${selectedBook.value}-${
      selectedChapter.value
    }-${Date.now()}`;

    set({
      isVideoLoading: true,
      currentLoadingRequest: requestId,
    });

    try {
      const bookName = selectedBook.value;
      const chapter = selectedChapter.value;

      const videoId = await get().getVideoIdByBookAndChapter(bookName, chapter);

      // Check if this is still the current request (no newer request has started)
      const currentRequest = get().currentLoadingRequest;
      if (currentRequest !== requestId) {
        return; // This request is outdated, ignore the result
      }

      // Update state only if this is still the current request
      set({
        currentVideoId: videoId,
        isVideoLoading: false,
        currentLoadingRequest: null,
      });
    } catch (error) {
      console.error("Error loading video:", error);

      // Only update error state if this is still the current request
      const currentRequest = get().currentLoadingRequest;
      if (currentRequest === requestId) {
        set({
          currentVideoId: null,
          isVideoLoading: false,
          currentLoadingRequest: null,
          currentPlayingVerse: null,
        });
      }
    }
  },
  getBibleVerseMarker: async (): Promise<VerseMarkerType[] | null> => {
    const { selectedBook, selectedChapter } = get();
    if (!selectedBook || !selectedChapter) {
      return null;
    }
    if (selectedChapter.value === 0) {
      set({ bibleVerseMarker: [], currentPlayingVerse: null });
      return null;
    }

    const verseMarkers = await get().getBibleVerseMarkerForBookAndChapter(
      selectedBook.label,
      selectedChapter.value
    );

    // Update the store state with the fetched data
    set({
      bibleVerseMarker: verseMarkers || [],
      currentPlayingVerse: null,
    });

    return verseMarkers;
  },
  seekToVerse: async (verse: string) => {
    const { bibleVerseMarker } = get();
    verse = verse.toString().includes("-")
      ? verse.toString().replace("-", "_")
      : verse.toString();

    const isVerseInRange = (
      targetVerse: string,
      rangeVerse: string
    ): boolean => {
      if (!rangeVerse.includes("_")) return false;

      const rangeParts = rangeVerse.split("_");
      if (rangeParts.length !== 2) return false;

      const startVerse = parseInt(rangeParts[0]);
      const endVerse = parseInt(rangeParts[1]);
      const targetVerseNum = parseInt(targetVerse);

      return (
        !isNaN(startVerse) &&
        !isNaN(endVerse) &&
        !isNaN(targetVerseNum) &&
        targetVerseNum >= startVerse &&
        targetVerseNum <= endVerse
      );
    };

    let marker = bibleVerseMarker?.find(
      (v) => v.verse.toString().trim() === verse.toString().trim()
    );

    if (!marker) {
      marker = bibleVerseMarker?.find((v) => {
        const markerVerse = v.verse.toString().trim();

        if (markerVerse.includes("_") && !verse.includes("_")) {
          return isVerseInRange(verse, markerVerse);
        }

        if (verse.includes("_") && !markerVerse.includes("_")) {
          return isVerseInRange(markerVerse, verse);
        }

        return false;
      });
    }

    if (marker) {
      const cleanedTime = marker.time.split(":").slice(0, 3).join(":");
      const event = new CustomEvent("seek-to-verse", {
        detail: { time: cleanedTime },
      });
      window.dispatchEvent(event);
    } else {
      console.warn(`No timestamp found for verse ${verse}`);
    }
  },
}));

export default useBibleStore;
