import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import useBibleStore from '@/store/useBibleStore';
import { BookOption, ChapterOption } from '../types/Navigation';

interface MobileBookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileBookDrawer: React.FC<MobileBookDrawerProps> = ({ isOpen, onClose }) => {
  const {
    selectedBook,
    selectedChapter,
    setBook,
    setChapter,
    availableData,
    isLoading,
    isInitialized,
    initializeAvailableData,
    getAvailableChaptersForBook,
    loadVideoForCurrentSelection,
  } = useBibleStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [filteredBooks, setFilteredBooks] = useState<BookOption[]>([]);
  const [chapterOptions, setChapterOptions] = useState<{ [bookCode: string]: ChapterOption[] }>({});
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const booksListRef = useRef<HTMLDivElement>(null);
  const selectedBookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeAvailableData();
    }
  }, [isInitialized, isLoading, initializeAvailableData]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(availableData.books || []);
    } else {
      const filtered = (availableData.books || []).filter(book =>
        book.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchTerm, availableData.books]);

  useEffect(() => {
    const newChapterOptions: { [bookCode: string]: ChapterOption[] } = {};
    availableData.books?.forEach(book => {
      newChapterOptions[book.value] = getAvailableChaptersForBook(book.value);
    });
    setChapterOptions(newChapterOptions);
  }, [availableData.books, getAvailableChaptersForBook]);

  useEffect(() => {
    if (isOpen && selectedBook) {
      setExpandedBook(selectedBook.value);
      setTimeout(() => {
        if (selectedBookRef.current && booksListRef.current) {
          const bookElement = selectedBookRef.current;
          const container = booksListRef.current;
          const containerTop = container.scrollTop;
          const containerBottom = containerTop + container.clientHeight;
          const elementTop = bookElement.offsetTop;
          const elementBottom = elementTop + bookElement.clientHeight;

          if (elementTop < containerTop || elementBottom > containerBottom) {
            bookElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 300);
    }
  }, [isOpen, selectedBook]);

  useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (isSearchFocused) {
          event.stopPropagation();
        }
      };
  
      if (isSearchFocused) {
        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
          document.removeEventListener("keydown", handleKeyDown, true);
        };
      }
    }, [isSearchFocused]);
  

  const handleBookClick = (book: BookOption) => {
    if (book.isDisabled) return;
    
    if (expandedBook === book.value) {
      setExpandedBook(null);
    } else {
      setExpandedBook(book.value);
    }
  };

  const handleChapterClick = (book: BookOption, chapter: ChapterOption) => {
    if (chapter.isDisabled) return;
    
    setBook(book);
    setChapter(chapter);
    
    onClose();
    setExpandedBook(null);
    setSearchTerm('');
    
    setTimeout(() => {
      loadVideoForCurrentSelection();
    }, 100);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setExpandedBook(null);
    setSearchTerm('');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      <div className={`fixed inset-0 z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="px-6 py-4 h-full overflow-hidden flex flex-col">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <div className="relative mb-6 pr-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-12 pr-10 py-3 border-2 rounded-2xl focus:border-[var(--indigo-color)] focus:outline-none text-gray-700 placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Books List */}
          <div ref={booksListRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {filteredBooks.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
                {searchTerm ? `No books found matching "${searchTerm}"` : 'No books available'}
              </div>
            ) : (
              filteredBooks.map((book) => (
                <div 
                  key={book.value} 
                  ref={selectedBook?.value === book.value ? selectedBookRef : null}
                  className="border-2 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => handleBookClick(book)}
                    disabled={book.isDisabled}
                    className={`w-full flex items-center justify-between p-2 transition-colors duration-200 ${
                      book.isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-[var(--indigo-color)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {book.image ? (
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <img
                            src={book.image}
                            alt={book.label}
                            className="w-10 h-10 object-contain"
                          />
                        </div>
                      ): (
                        <div className='w-10 h-10' />
                      )}
                      <span className={`font-medium text-left ${
                        book.isDisabled ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        {book.label}
                      </span>
                    </div>
                    {!book.isDisabled && (
                      <ChevronDown
                        size={20}
                        className={`text-[var(--indigo-color)]-500 transition-transform duration-200 ${
                          expandedBook === book.value ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Chapters Grid */}
                  {expandedBook === book.value && chapterOptions[book.value] && (
                    <div className="px-4 pb-4 border-t">
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-3">
                        {chapterOptions[book.value].map((chapter) => {
                          const isSelected = selectedBook?.value === book.value && selectedChapter?.value === chapter.value;
                          
                          return (
                            <button
                              key={chapter.value}
                              onClick={() => handleChapterClick(book, chapter)}
                              disabled={chapter.isDisabled}
                              className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                chapter.isDisabled
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-[var(--indigo-color)] text-white font-bold'
                                    : 'bg-white text-[var(--indigo-color)]-500 hover:bg-[var(--indigo-color)] hover:text-white border border-[var(--indigo-color)]'
                              }`}
                            >
                              {chapter.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-[var(--indigo-color)] text-white rounded-xl font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBookDrawer;