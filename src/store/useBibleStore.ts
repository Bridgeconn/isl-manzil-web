import { create } from "zustand";
import { BookOption, ChapterOption, VerseOption } from "../types/Navigation";
import bookCodesData from "../assets/data/book_codes.json";

export interface BibleVideo {
  videoId: number;
  book: string;
  chapter: number;
  title: string;
}

const bibleVideos: Record<string, BibleVideo> = {
  "titus-1": {
    videoId: 1084607568,
    book: "Titus",
    chapter: 1,
    title: "Titus Chapter 1",
  },
};
const getVideoId = () => {
  const book = bookCodesData[0]
  const bookName = book.book.toLowerCase()
  const key = `${bookName}-1`
  return bibleVideos[key] ? bibleVideos[key].videoId : bibleVideos[Object.keys(bibleVideos)[0]].videoId
}

interface BibleStore {
  selectedBook: BookOption | null;
  selectedChapter: ChapterOption | null;
  selectedVerse: VerseOption | null;
  currentVideoId: number;

  setBook: (book: BookOption | null) => void;
  setChapter: (chapter: ChapterOption | null) => void;
  setVerse: (verse: VerseOption | null) => void;
  setCurrentVideoId: (videoId: number) => void;
}

const useBibleStore = create<BibleStore>((set) => ({
  selectedBook: null,
  selectedChapter: null,
  selectedVerse: null,
  currentVideoId: getVideoId(),

  setBook: (book: BookOption | null) => set({ selectedBook: book }),
  setChapter: (chapter: ChapterOption | null) =>
    set({ selectedChapter: chapter }),
  setVerse: (verse: VerseOption | null) => set({ selectedVerse: verse }),
  setCurrentVideoId: (videoId: number) => set({ currentVideoId: videoId }),
}));

export default useBibleStore;
