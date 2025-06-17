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
    if (!currentPlayingVerse) return false;

    const normalizedVerseNumber = verseNumber.toString().includes("-")
      ? verseNumber.toString().replace("-", "_")
      : verseNumber.toString();


    const normalizedCurrentPlaying = currentPlayingVerse.includes("-")
      ? currentPlayingVerse.replace("-", "_")
      : currentPlayingVerse;


    if (normalizedCurrentPlaying === normalizedVerseNumber) return true;

    const isVerseInRange = (verse: string, range: string): boolean => {
      if (!range.includes("_")) return false;

      const rangeParts = range.split("_");
      if (rangeParts.length !== 2) return false;

      const startVerse = parseInt(rangeParts[0]);
      const endVerse = parseInt(rangeParts[1]);
      const verseNum = parseInt(verse);

      return (
        !isNaN(startVerse) &&
        !isNaN(endVerse) &&
        !isNaN(verseNum) &&
        verseNum >= startVerse &&
        verseNum <= endVerse
      );
    };

    if (
      normalizedCurrentPlaying.includes("_") &&
      !normalizedVerseNumber.includes("_")
    ) {
      return isVerseInRange(normalizedVerseNumber, normalizedCurrentPlaying);
    }

    if (
      normalizedVerseNumber.includes("_") &&
      !normalizedCurrentPlaying.includes("_")
    ) {
      return isVerseInRange(normalizedCurrentPlaying, normalizedVerseNumber);
    }

    return false;
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

          {!isFetching && !error && verseData.length > 0 && (
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
                  className={`themed-text text-themed antialiased tracking-wide  ml-2 cursor-pointer rounded transition-colors duration-300 ${
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
                          className={`themed-text text-themed text-gray-500  mr-2 rounded transition-colors duration-300 ${
                            isPlaying ? "bg-blue-200" : ""
                          }`}
                        >
                          {verseItem.verse}
                        </span>
                        <span
                          className={`themed-text text-themed antialiased tracking-wide  rounded transition-colors duration-300 ${
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
