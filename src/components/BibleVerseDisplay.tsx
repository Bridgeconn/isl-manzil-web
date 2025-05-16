import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { VerseData } from "@/types/bible";
import useBibleStore from "@/store/useBibleStore";

const BibleVerseDisplay = () => {
  const { selectedBook, selectedChapter, selectedVerse } = useBibleStore();
  const [verseData, setVerseData] = useState<VerseData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const chapterCache = useRef<Record<string, VerseData[]>>({});

  const csvFiles = import.meta.glob("/src/assets/data/books/**/*.csv", { 
    query: '?raw',
    import: 'default'
  });

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
          throw new Error(`CSV file not found for ${bookCode} chapter ${chapterNum}`);
        }
        
        const csvText = await csvFiles[filePath]() as string;
        
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
        setError(`Error fetching verse data: ${err instanceof Error ? err.message : String(err)}`);
        setIsFetching(false);
      }
    };
    
    fetchData();
  }, [selectedBook, selectedChapter, selectedVerse, csvFiles]);

  const renderVerseContent = () => {
    if (isFetching) return <p className="text-center py-4">Loading verses...</p>;
    if (error) return <p className="text-center py-4 text-red-500">{error}</p>;
    if (!verseData.length)
      return <p className="text-center py-4">No verses available</p>;

    return (
      <div className="space-y-2 py-2">
        {verseData.map((verseItem, index) => {
          return (
            <div key={index} >
              <span className="font-semibold text-gray-500 mr-2 text-sm">
                {verseItem.verse}
              </span>
              <span className="antialiased tracking-wide font-normal font-roboto">{verseItem.text}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {selectedBook && selectedChapter && (
        <div className="flex">
          <span className="text-5xl font-bold text-gray-800 mr-2">
            {selectedChapter.value}
          </span>
          {renderVerseContent()}
        </div>
      )}
    </>
  );
};

export default BibleVerseDisplay;
