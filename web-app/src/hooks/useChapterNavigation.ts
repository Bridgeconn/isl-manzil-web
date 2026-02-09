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
    getAvailableChaptersForBook,
    getAvailableVersesForBookAndChapter,
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
  const goToPreviousChapter = async () => {
    if (!selectedBook || !selectedChapter || !navigationState.canGoPrevious) {
      return;
    }

    const currentBookIndex = bookCodesData.findIndex(
      (book) => book.bookCode === selectedBook.value
    );
    const currentChapter = selectedChapter.value;

    if (currentChapter > 1) {
      const prevChapterValue = currentChapter - 1;
      const prevChapter: ChapterOption = {
        value: prevChapterValue,
        label: `${prevChapterValue}`,
      };
      setChapter(prevChapter);

      const availableVerses = await getAvailableVersesForBookAndChapter(
        selectedBook.value,
        prevChapterValue
      );
      if (availableVerses.length > 0) {
        setVerse(availableVerses[0]);
      }
    } else if (currentBookIndex > 0) {
      const prevBook = bookCodesData[currentBookIndex - 1];
      const newBook: BookOption = {
        value: prevBook.bookCode,
        label: prevBook.book,
        bookId: prevBook.bookId,
        image: prevBook?.filename ? "/books/" + prevBook?.filename : "",
      };

      setBook(newBook);

      const availableChapters = getAvailableChaptersForBook(prevBook.bookCode);
      const numberedChapters = availableChapters.filter((ch) => ch.value > 0);
      if (numberedChapters.length > 0) {
        const maxChapterValue = Math.max(...numberedChapters.map((ch) => ch.value));
        const lastChapter = { value: maxChapterValue, label: `${maxChapterValue}` };
        setChapter(lastChapter);

        const availableVerses = await getAvailableVersesForBookAndChapter(
          prevBook.bookCode,
          lastChapter.value
        );
        if (availableVerses.length > 0) {
          setVerse(availableVerses[0]);
        }
      }
    }
  };

  // Navigate to next chapter
  const goToNextChapter = async () => {
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
      const nextChapterValue = currentChapter + 1;
      const nextChapter: ChapterOption = {
        value: nextChapterValue,
        label: `${nextChapterValue}`,
      };
      setChapter(nextChapter);

      const availableVerses = await getAvailableVersesForBookAndChapter(
        selectedBook.value,
        nextChapterValue
      );
      if (availableVerses.length > 0) {
        setVerse(availableVerses[0]);
      }
    } else if (currentBookIndex < bookCodesData.length - 1) {
      const nextBook = bookCodesData[currentBookIndex + 1];
      const newBook: BookOption = {
        value: nextBook.bookCode,
        label: nextBook.book,
        bookId: nextBook.bookId,
        image: nextBook?.filename ? "/books/" + nextBook?.filename : "",
      };

      setBook(newBook);

      const availableChapters = getAvailableChaptersForBook(nextBook.bookCode);
      const numberedChapters = availableChapters.filter((ch) => ch.value > 0);
      if (numberedChapters.length > 0) {
        const firstAvailableChapter = { value: numberedChapters[0].value, label: `${numberedChapters[0].value}` };
        setChapter(firstAvailableChapter);

        const availableVerses = await getAvailableVersesForBookAndChapter(
          nextBook.bookCode,
          firstAvailableChapter.value
        );
        if (availableVerses.length > 0) {
          setVerse(availableVerses[0]);
        }
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
