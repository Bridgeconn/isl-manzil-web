import { useMemo } from "react";
import useBibleStore from "@/store/useBibleStore";
import bookCodesData from "../assets/data/book_codes.json";
import versificationData from "../assets/data/versification.json";
import { VersificationData } from "../types/bible";
import { BookOption, ChapterOption } from "../types/Navigation";

export const useChapterNavigation = () => {
  const {
    selectedBook,
    selectedChapter,
    setBook,
    setChapter,
    setVerse,
  } = useBibleStore();

  const typedVersificationData = versificationData as VersificationData;

  const navigationState = useMemo(() => {
    if (!selectedBook || !selectedChapter) {
      return { canGoPrevious: false, canGoNext: false };
    }

    const currentBookIndex = bookCodesData.findIndex(
      (book) => book.bookCode === selectedBook.value
    );
    const currentChapter = selectedChapter.value;

    const isFirstChapter = currentBookIndex === 0 && currentChapter === 1;

    const isLastBook = currentBookIndex === bookCodesData.length - 1;
    const bookCode = selectedBook.value.toUpperCase();
    const maxChapters =
      typedVersificationData.maxVerses[bookCode]?.length || 0;
    const isLastChapter = isLastBook && currentChapter === maxChapters;

    return {
      canGoPrevious: !isFirstChapter,
      canGoNext: !isLastChapter,
    };
  }, [selectedBook, selectedChapter, typedVersificationData]);

  // Navigate to previous chapter
  const goToPreviousChapter = () => {
    if (!selectedBook || !selectedChapter || !navigationState.canGoPrevious) {
      return;
    }

    const currentBookIndex = bookCodesData.findIndex(
      (book) => book.bookCode === selectedBook.value
    );
    const currentChapter = selectedChapter.value;

    if (currentChapter > 1) {
      // Go to previous chapter in same book
      const prevChapter: ChapterOption = {
        value: currentChapter - 1,
        label: `${currentChapter - 1}`,
      };
      setChapter(prevChapter);
    } else if (currentBookIndex > 0) {
      // Go to last chapter of previous book
      const prevBook = bookCodesData[currentBookIndex - 1];
      const newBook: BookOption = {
        value: prevBook.bookCode,
        label: prevBook.book,
        bookId: prevBook.bookId,
        image: prevBook?.filename ? "/books/" + prevBook?.filename : "",
      };

      setBook(newBook);

      // Get last chapter of previous book
      const prevBookCode = prevBook.bookCode.toUpperCase();
      const maxChaptersInPrevBook =
        typedVersificationData.maxVerses[prevBookCode]?.length || 0;
      const lastChapter: ChapterOption = {
        value: maxChaptersInPrevBook,
        label: `${maxChaptersInPrevBook}`,
      };
      setChapter(lastChapter);

      // Set first verse of that chapter
      const maxVerses =
        typedVersificationData.maxVerses[prevBookCode]?.[
          maxChaptersInPrevBook - 1
        ] || "0";
      if (parseInt(maxVerses) > 0) {
        setVerse({ value: 1, label: "1" });
      }
    }
  };

  // Navigate to next chapter
  const goToNextChapter = () => {
    if (!selectedBook || !selectedChapter || !navigationState.canGoNext) {
      return;
    }

    const currentBookIndex = bookCodesData.findIndex(
      (book) => book.bookCode === selectedBook.value
    );
    const currentChapter = selectedChapter.value;
    const bookCode = selectedBook.value.toUpperCase();
    const maxChapters =
      typedVersificationData.maxVerses[bookCode]?.length || 0;

    if (currentChapter < maxChapters) {
      // Go to next chapter in same book
      const nextChapter: ChapterOption = {
        value: currentChapter + 1,
        label: `${currentChapter + 1}`,
      };
      setChapter(nextChapter);
    } else if (currentBookIndex < bookCodesData.length - 1) {
      // Go to first chapter of next book
      const nextBook = bookCodesData[currentBookIndex + 1];
      const newBook: BookOption = {
        value: nextBook.bookCode,
        label: nextBook.book,
        bookId: nextBook.bookId,
        image: nextBook?.filename ? "/books/" + nextBook?.filename : "",
      };

      setBook(newBook);
      const firstChapter: ChapterOption = {
        value: 1,
        label: "1",
      };
      setChapter(firstChapter);

      // Set first verse
      const newBookCode = nextBook.bookCode.toUpperCase();
      const maxVerses =
        typedVersificationData.maxVerses[newBookCode]?.[0] || "0";
      if (parseInt(maxVerses) > 0) {
        setVerse({ value: 1, label: "1" });
      }
    }
  };

  const navigateToChapter = (direction: "previous" | "next") => {
    if (direction === "previous") {
      goToPreviousChapter();
    } else {
      goToNextChapter();
    }
  };

  return {
    canGoPrevious: navigationState.canGoPrevious,
    canGoNext: navigationState.canGoNext,
    navigateToChapter,
  };
};