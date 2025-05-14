import { BookOption, ChapterOption, VerseOption } from './Navigation';
export interface VersificationData {
  maxVerses: {
    [bookCode: string]: string[];
  };
}

export interface BibleVerseDisplayProps {
  selectedBook: BookOption | null;
  selectedChapter: ChapterOption | null;
  selectedVerse?: VerseOption | null;
}

export interface VerseData {
  verse: string;
  text: string;
}
