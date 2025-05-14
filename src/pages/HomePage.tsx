import { useState } from "react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import SelectBoxContainer from "@/components/SelectBoxContainer";
import BibleVerseDisplay from "@/components/BibleVerseDisplay";
import { BookOption, ChapterOption, VerseOption } from "@/types/Navigation";

const HomePage: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterOption | null>(
    null
  );
  const [selectedVerse, setSelectedVerse] = useState<VerseOption | null>(null);

  const handleSelectionChange = (
    book: BookOption | null,
    chapter: ChapterOption | null,
    verse: VerseOption | null
  ) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setSelectedVerse(verse);
  };

  return (
    <>
      <div className="w-full bg-gray-100 flex justify-between mt-1 mb-6 py-1 px-2">
        <SelectBoxContainer onSelectionChange={handleSelectionChange} />
        <div></div>
      </div>

      <div className="px-4">
        <CustomVideoPlayer />
      </div>
      <div className="verse-content-container w-full sm:w-3/4 mx-auto my-2 bg-gray-50 border-4 rounded-md px-4 py-2">
        <BibleVerseDisplay
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          selectedVerse={selectedVerse}
        />
      </div>
    </>
  );
};

export default HomePage;
