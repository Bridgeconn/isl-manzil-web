import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { VerseData } from "@/types/bible";
import useBibleStore from "@/store/useBibleStore";
import useThemeStore from "@/store/useThemeStore";

const BibleVerseDisplay = ({
  setIsIntroDataAvailable,
}: {
  setIsIntroDataAvailable: (value: boolean) => void;
}) => {
  const { selectedBook, selectedChapter, currentPlayingVerse, seekToVerse } =
    useBibleStore();
  const { fontType, fontSize } = useThemeStore();
  const [verseData, setVerseData] = useState<VerseData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const chapterCache = useRef<Record<string, VerseData[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Clear refs when data changes
  useEffect(() => {
    verseRefs.current = {};
  }, [verseData]);

  const csvFiles = import.meta.glob("/src/assets/data/books/**/*.csv", {
    query: "?raw",
    import: "default",
  });

  // Auto-scroll as per current playing verse
  useEffect(() => {
    if (!currentPlayingVerse || !verseData.length) return;

    const scrollToVerse = () => {
      const verseElement = verseRefs.current[currentPlayingVerse];

      if (verseElement) {
        verseElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    };

    const timeoutId = setTimeout(scrollToVerse, 200);

    return () => clearTimeout(timeoutId);
  }, [currentPlayingVerse, verseData]);

  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;

    const bookCode = selectedBook.value.toLowerCase();
    const chapterNum = selectedChapter.value;

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
          if (chapterNum === 0) {
            setVerseData([]);
            setIsFetching(false);
            setIsIntroDataAvailable(false);
            return;
          }
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
  }, [selectedBook, selectedChapter]);

  const renderLoadingOrError = () => {
    if (isFetching)
      return <p className="text-center py-4">Loading verses...</p>;
    if (error) return <p className="text-center py-4 text-red-500">{error}</p>;
    if (!verseData.length)
      return <p className="text-center py-4">No verses available</p>;
    return null;
  };

  const isCurrentVerse = (verseNumber: string | number): boolean => {
    return currentPlayingVerse === verseNumber.toString();
  };

  const setVerseRef = (
    verseNumber: string | number,
    element: HTMLDivElement | null
  ) => {
    verseRefs.current[verseNumber.toString()] = element;
  };

  return (
    <>
      {selectedBook && selectedChapter && (
        <>
          {renderLoadingOrError()}

          {!isFetching && !error && verseData.length > 0 && (
            <div
              ref={containerRef}
              className={`flex flex-col h-full overflow-y-auto custom-scroll-ultra-thin ${
                fontType === "serif" ? "font-serif" : "font-sans"
              }`}
              style={{
                scrollBehavior: "smooth",
                fontSize: `${fontSize}px`,
              }}
            >
              <div
                className="mb-2"
                ref={(el) => setVerseRef(verseData[0]?.verse, el)}
                id={`verse-${verseData[0]?.verse}`}
              >
                <span className="themed-text text-4xl font-bold text-gray-800">
                  {selectedChapter.value}
                </span>
                <span
                  className={`themed-text antialiased tracking-wide font-normal font-roboto ml-2 cursor-pointer rounded transition-colors duration-300 ${
                    isCurrentVerse(verseData[0]?.verse) ? "bg-blue-200" : ""
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
                          className={`themed-text font-semibold text-gray-500 text-sm mr-2 rounded transition-colors duration-300 ${
                            isPlaying ? "bg-blue-200" : ""
                          }`}
                        >
                          {verseItem.verse}
                        </span>
                        <span
                          className={`themed-text antialiased tracking-wide font-normal font-roboto rounded transition-colors duration-300 ${
                            isPlaying ? "bg-blue-200" : ""
                          }`}
                        >
                          {verseItem.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default BibleVerseDisplay;
