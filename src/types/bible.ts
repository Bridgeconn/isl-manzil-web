export interface VersificationData {
  maxVerses: {
    [bookCode: string]: string[];
  };
}

export interface VerseData {
  verse: string;
  text: string;
}

export interface Book {
    bookCode: string;
    book: string;
    bookId: number;
    filename?: string;
  }


