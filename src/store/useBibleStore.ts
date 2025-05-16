import { create } from 'zustand';
import { BookOption, ChapterOption, VerseOption } from '../types/Navigation';

interface BibleStore {
  selectedBook: BookOption | null;
  selectedChapter: ChapterOption | null;
  selectedVerse: VerseOption | null;
  
  setBook: (book: BookOption | null) => void;
  setChapter: (chapter: ChapterOption | null) => void;
  setVerse: (verse: VerseOption | null) => void;
}

const useBibleStore = create<BibleStore>((set) => ({
  selectedBook: null,
  selectedChapter: null, 
  selectedVerse: null,
  
  setBook: (book: BookOption | null) => set({ selectedBook: book }),
  setChapter: (chapter: ChapterOption | null) => set({ selectedChapter: chapter }),
  setVerse: (verse: VerseOption | null) => set({ selectedVerse: verse })
}));

export default useBibleStore;