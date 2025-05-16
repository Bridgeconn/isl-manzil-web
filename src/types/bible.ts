export interface VersificationData {
  maxVerses: {
    [bookCode: string]: string[];
  };
}

export interface VerseData {
  verse: string;
  text: string;
}
