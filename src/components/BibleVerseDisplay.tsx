import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import ReactMarkdown from "react-markdown";
import { VerseData } from "@/types/bible";
import useBibleStore from "@/store/useBibleStore";
import useThemeStore from "@/store/useThemeStore";

const BibleVerseDisplay = () => {
  const {
    availableData,
    selectedBook,
    selectedChapter,
    currentPlayingVerse,
    seekToVerse,
  } = useBibleStore();
  const { fontType, fontSize } = useThemeStore();
  const [verseData, setVerseData] = useState<VerseData[]>([]);
  const [introData, setIntroData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const chapterCache = useRef<Record<string, VerseData[]>>({});
  const introCache = useRef<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasFetchedRef = useRef(false);

  const pathParts =
    typeof window !== "undefined" ? window.location.pathname.split("/") : [];
  const urlBook = pathParts[2] || null;
  const urlChapter = ["Introduction", "Intro"].includes(pathParts[3])
    ? 0
    : pathParts[3]
    ? Number(pathParts[3])
    : null;

  // Clear refs when data changes
  useEffect(() => {
    verseRefs.current = {};
  }, [verseData]);

  const csvFiles = import.meta.glob("/src/assets/data/books/**/*.csv", {
    query: "?raw",
    import: "default",
  });

  const mdFiles = import.meta.glob("/src/assets/data/books/**/*.md", {
    query: "?raw",
    import: "default",
  });

  const scrollToVerseInContainer = (verseElement: HTMLDivElement) => {
    if (!containerRef.current || !verseElement) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const verseRect = verseElement.getBoundingClientRect();

    // Calculate the verse position relative to the container
    const verseTop = verseRect.top - containerRect.top;
    const verseBottom = verseRect.bottom - containerRect.top;

    // Get container dimensions
    const containerHeight = container.clientHeight;
    const containerScrollTop = container.scrollTop;

    // Calculate target scroll position to center the verse in the container
    const targetScrollTop =
      containerScrollTop +
      verseTop -
      containerHeight / 2 +
      verseRect.height / 2;

    const isVerseVisible = verseTop >= 0 && verseBottom <= containerHeight;

    if (!isVerseVisible) {
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll as per current playing verse
  useEffect(() => {
    if (!currentPlayingVerse || !verseData.length) return;

    const scrollToVerse = () => {
      const normalizedCurrentVerse = currentPlayingVerse.includes("-")
        ? currentPlayingVerse.replace("-", "_")
        : currentPlayingVerse;
      let verseElement = verseRefs.current[normalizedCurrentVerse];

      if (!verseElement) {
        const currentVerseNum = parseInt(normalizedCurrentVerse);

        if (!isNaN(currentVerseNum)) {
          for (const [refKey, element] of Object.entries(verseRefs.current)) {
            if (element && refKey.includes("_")) {
              const rangeParts = refKey.split("_");
              if (rangeParts.length === 2) {
                const startVerse = parseInt(rangeParts[0]);
                const endVerse = parseInt(rangeParts[1]);

                if (!isNaN(startVerse) && !isNaN(endVerse)) {
                  if (
                    currentVerseNum >= startVerse &&
                    currentVerseNum <= endVerse
                  ) {
                    verseElement = element;
                    break;
                  }
                }
              }
            }
          }
        }
      }

      if (!verseElement && normalizedCurrentVerse.includes("_")) {
        const firstVerse = normalizedCurrentVerse.split("_")[0];
        verseElement = verseRefs.current[firstVerse];
      }

      if (!verseElement) {
        verseElement = verseRefs.current[currentPlayingVerse];
      }

      if (verseElement) {
        // Use our custom container-constrained scroll instead of scrollIntoView
        scrollToVerseInContainer(verseElement);
      }
    };

    const timeoutId = setTimeout(scrollToVerse, 200);

    return () => clearTimeout(timeoutId);
  }, [currentPlayingVerse, verseData]);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      if (urlBook && urlChapter !== null) {
        const parsedChapter = Number(urlChapter);

        const isFallbackToIntro =
          selectedBook?.value === urlBook && selectedChapter?.value === 0;

        const isExactMatch =
          selectedBook?.value === urlBook &&
          selectedChapter?.value === parsedChapter;

        if (!isExactMatch && !isFallbackToIntro) {
          return;
        }
      }
      hasFetchedRef.current = true;
    }

    if (!selectedBook || !selectedChapter || !availableData) return;
    setIntroData(null);
    setVerseData([]);
    const bookCode = selectedBook.value.toLowerCase();
    const chapterNum = selectedChapter.value;

    const isIntro = chapterNum === 0;

    if (isIntro) {
      setVerseData([]);
      const introCacheKey = `${bookCode}-intro`;

      if (introCache.current[introCacheKey]) {
        setIntroData(introCache.current[introCacheKey]);
        return;
      }

      const fetchIntroData = async () => {
        setIsFetching(true);
        setError(null);

        try {
          const filePath = `/src/assets/data/books/${bookCode}/${bookCode}_intro.md`;

          if (!mdFiles[filePath]) {
            setIntroData(null);
            setIsFetching(false);
            return;
          }

          const mdText = (await mdFiles[filePath]()) as string;
          introCache.current[introCacheKey] = mdText;
          setIntroData(mdText);
          setIsFetching(false);
        } catch (err) {
          setError(
            `Error fetching intro data: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          setIsFetching(false);
        }
      };

      fetchIntroData();
    } else {
      setIntroData(null);
      const cacheKey = `${bookCode}-${chapterNum}`;

      if (chapterCache.current[cacheKey]) {
        setVerseData(chapterCache.current[cacheKey]);
        return;
      }

      const fetchData = async () => {
        setIsFetching(true);
        setError(null);

        try {
          const filePath = `/src/assets/data/books/${bookCode}/${chapterNum}.csv`;

          if (!csvFiles[filePath]) {
            throw new Error(
              `CSV file not found for ${bookCode} chapter ${chapterNum}`
            );
          }

          const csvText = (await csvFiles[filePath]()) as string;

          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const parsedData = results.data as VerseData[];
              chapterCache.current[cacheKey] = parsedData;
              setVerseData(parsedData);
              setIsFetching(false);
            },
            error: (error: Error) => {
              setError(`Error parsing CSV: ${error.message}`);
              setIsFetching(false);
            },
          });
        } catch (err) {
          setError(
            `Error fetching verse data: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          setIsFetching(false);
        }
      };

      fetchData();
    }
  }, [selectedBook, selectedChapter]);

  const renderLoadingOrError = () => {
    if (isFetching) return <p className="text-center py-4">Loading...</p>;
    if (error) return <p className="text-center py-4 text-red-500">{error}</p>;
    return null;
  };

  const hasOverlap = (range1: string, range2: string): boolean => {
    const parseRange = (str: string) => {
      const normalized = str.replace("-", "_");
      if (normalized.includes("_")) {
        const [start, end] = normalized.split("_").map(Number);
        return { start, end };
      }
      const num = Number(normalized);
      return { start: num, end: num };
    };

    const r1 = parseRange(range1);
    const r2 = parseRange(range2);

    return r1.start <= r2.end && r2.start <= r1.end;
  };

  const isCurrentVerse = (verseNumber: string | number): boolean => {
    if (!currentPlayingVerse) return false;
    return hasOverlap(currentPlayingVerse, verseNumber.toString());
  };

  const setVerseRef = (
    verseNumber: string | number,
    element: HTMLDivElement | null
  ) => {
    const normalizedVerseNumber = verseNumber.toString().includes("-")
      ? verseNumber.toString().replace("-", "_")
      : verseNumber.toString();
    verseRefs.current[normalizedVerseNumber] = element;
  };

  return (
    <>
      {selectedBook && selectedChapter && (
        <>
          {renderLoadingOrError()}

          {!isFetching && !error && (
            <div
              ref={containerRef}
              className={`flex flex-col h-full overflow-y-auto custom-scroll-ultra-thin pr-3 ${
                fontType === "serif" ? "font-serif" : "font-sans"
              }`}
              style={{
                scrollBehavior: "smooth",
                fontSize: `${fontSize}px`,
              }}
            >
              {introData && (
                <div className="antialiased tracking-wide prose max-w-none prose-themed themed-text text-themed">
                  <ReactMarkdown>{introData}</ReactMarkdown>
                </div>
              )}

              {!introData && verseData.length > 0 && (
                <>
                  <div
                    className="mb-2"
                    ref={(el) => setVerseRef(verseData[0]?.verse, el)}
                    id={`verse-${verseData[0]?.verse}`}
                  >
                    <span
                      style={{ fontSize: "1.6em" }}
                      className="themed-text text-themed font-bold text-gray-800"
                    >
                      {selectedChapter.value}
                    </span>
                    <span
                      className={`antialiased tracking-wide ml-2 cursor-pointer rounded transition-colors duration-300 ${
                        isCurrentVerse(verseData[0]?.verse)
                          ? "themed-reverse text-themed"
                          : "themed-text text-themed"
                      }`}
                      onClick={() => seekToVerse(verseData[0]?.verse)}
                    >
                      {verseData[0]?.text}
                    </span>
                  </div>

                  {verseData.length > 1 && (
                    <div className="space-y-2 ml-1">
                      {verseData.slice(1).map((verseItem, index) => {
                        const isPlaying = isCurrentVerse(verseItem.verse);
                        return (
                          <div
                            className="cursor-pointer"
                            key={index + 1}
                            id={`verse-${verseItem.verse}`}
                            onClick={() => seekToVerse(verseItem.verse)}
                            ref={(el) => setVerseRef(verseItem.verse, el)}
                          >
                            <span
                              className={`mr-2 rounded transition-colors duration-300 ${
                                isPlaying
                                  ? "themed-reverse text-themed"
                                  : "themed-text text-themed text-gray-500"
                              }`}
                            >
                              {verseItem.verse}
                            </span>
                            <span
                              className={`antialiased tracking-wide rounded transition-colors duration-300 ${
                                isPlaying
                                  ? "themed-reverse text-themed"
                                  : "themed-text text-themed"
                              }`}
                            >
                              {verseItem.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {!introData &&
                verseData.length === 0 &&
                !isFetching &&
                !error && (
                  <p className="text-center py-4 text-themed themed-text">
                    No content available
                  </p>
                )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default BibleVerseDisplay;
