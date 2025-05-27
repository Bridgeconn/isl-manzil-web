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

interface BibleStore {
  selectedBook: BookOption | null;
  selectedChapter: ChapterOption | null;
  selectedVerse: VerseOption | null;
  currentVideoId: number | null;
  availableData: AvailableData;
  bibleVerseMarker: VerseMarkerType[] | null;
  isLoading: boolean;
  isInitialized: boolean;
  seekToVerse: (verse: string) => void;
  isVideoLoading: boolean;
  // Add request tracking
  currentLoadingRequest: string | null;

  setBook: (book: BookOption | null) => void;
  setChapter: (chapter: ChapterOption | null) => void;
  setVerse: (verse: VerseOption | null) => void;
  setCurrentVideoId: (videoId: number | null) => void;
  getVideoUrlData: () => Promise<VideoLinkRowData[] | null>;
  initializeAvailableData: () => Promise<void>;
  getAvailableChaptersForBook: (bookCode: string) => ChapterOption[];
  getAvailableVersesForBookAndChapter: (
    bookCode: string,
    chapter: number
  ) => VerseOption[];
  getVideoIdByBookAndChapter: (
    book: string,
    chapter: number
  ) => Promise<number | null>;
  loadVideoForCurrentSelection: () => void;
  getBibleVerseMarker: () => Promise<VerseMarkerType[] | null>;
}

const typedVersificationData = versificationData as VersificationData;

const useBibleStore = create<BibleStore>((set, get) => ({
  selectedBook: null,
  selectedChapter: null,
  selectedVerse: null,
  currentVideoId: null,
  isLoading: false,
  isInitialized: false,
  isVideoLoading: false,
  availableData: {
    books: [],
    chapters: {},
  },
  bibleVerseMarker: [],
  currentLoadingRequest: null,

  setBook: (book: BookOption | null) => {
    set({ selectedBook: book });

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

  setChapter: (chapter: ChapterOption | null) => {
    set({ selectedChapter: chapter });

    // Auto-set first verse when chapter changes
    if (chapter && get().selectedBook) {
      const availableVerses = get().getAvailableVersesForBookAndChapter(
        get().selectedBook!.value,
        chapter.value
      );
      if (availableVerses.length > 0) {
        get().setVerse(availableVerses[0]);
      } else {
        get().setVerse(null);
      }
    } else {
      get().setVerse(null);
    }
  },

  setVerse: (verse: VerseOption | null) => set({ selectedVerse: verse }),
  setCurrentVideoId: (videoId: number | null) =>
    set({ currentVideoId: videoId }),

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
        if (row.BookCode && row.Chapter && parseInt(row.Chapter) > 0) {
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

    return allChapters;
  },

  getAvailableVersesForBookAndChapter: (
    bookCode: string,
    chapter: number
  ): VerseOption[] => {
    const bookCodeUpper = bookCode.toUpperCase();
    const chapterIndex = chapter - 1;

    const maxVerses = parseInt(
      typedVersificationData.maxVerses[bookCodeUpper]?.[chapterIndex] || "0"
    );

    const verses: VerseOption[] = Array.from({ length: maxVerses }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}`,
    }));

    return verses;
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
    const requestId = `${selectedBook.value}-${selectedChapter.value}-${Date.now()}`;
    
    set({
      isVideoLoading: true,
      currentLoadingRequest: requestId,
    });

    try {
      const bookName = selectedBook.value;
      const chapter = parseInt(selectedChapter.label);
      
      const videoId = await get().getVideoIdByBookAndChapter(bookName, chapter);
      
      // Check if this is still the current request (no newer request has started)
      const currentRequest = get().currentLoadingRequest;
      if (currentRequest !== requestId) {
        console.log('Request outdated, ignoring result:', requestId);
        return; // This request is outdated, ignore the result
      }

      // Update state only if this is still the current request
      set({
        currentVideoId: videoId,
        isVideoLoading: false,
        currentLoadingRequest: null,
      });
      
    } catch (error) {
      console.error('Error loading video:', error);
      
      // Only update error state if this is still the current request
      const currentRequest = get().currentLoadingRequest;
      if (currentRequest === requestId) {
        set({
          currentVideoId: null,
          isVideoLoading: false,
          currentLoadingRequest: null,
        });
      }
    }
  },
  getBibleVerseMarker: async (): Promise<VerseMarkerType[] | null> => {
    const { selectedBook, selectedChapter } = get();
    if (!selectedBook || !selectedChapter) {
      return null;
    }
    try {
      const csvFiles = import.meta.glob(
        "/src/assets/data/verse_markers/*.csv",
        {
          query: "?raw",
          import: "default",
        }
      );
      console.log("csv files", csvFiles);
      const filePath = `/src/assets/data/verse_markers/${selectedBook.label}_${selectedChapter.label}.csv`;
      console.log("file path", filePath);
      if (!csvFiles[filePath]) {
        set({ bibleVerseMarker: [] });
        console.warn(
          `Verse marker file not found: ${selectedBook.label}_${selectedChapter.label}.csv`
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
            id: index,
            verse: row.verse.toString().trim() || "",
            time: row.time.toString().trim() || "",
          };
        }
      );
      set({ bibleVerseMarker: formattedVerseMarkerData });
      return formattedVerseMarkerData;
    } catch (err) {
      console.error(`Failed to load verse markers:`, err);
      set({ bibleVerseMarker: [] });
      return null;
    }
  },
  seekToVerse: async (verse: string) => {
    const { bibleVerseMarker } = get();
    // console.log("bibleVerseMarker", bibleVerseMarker);
    console.log("verse", verse);

    const marker = bibleVerseMarker?.find((v) =>  v.verse.toString().trim() === verse.toString().trim()
  );
  console.log("marker", marker);
    const cleanedTime = marker && marker.time.split(":").slice(0, 3).join(":");

    // console.log("cleaned time", cleanedTime);
    if (marker) {
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
