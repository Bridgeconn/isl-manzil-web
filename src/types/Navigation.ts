export interface NavbarItem {
  name: string;
  path: string;
}

export interface BaseOption {
  value: string | number;
  label: string;
}

export interface BookOption extends BaseOption {
  value: string;
  bookId: number;
  image?: string;
}

export interface ChapterOption extends BaseOption {
  value: number;
}

export interface VerseOption extends BaseOption {
  value: number;
}

export type OptionType = BookOption | ChapterOption | VerseOption;

export interface SelectBoxContainerProps {
  onSelectionChange?: (book: BookOption | null, chapter: ChapterOption | null, verse: VerseOption | null) => void;
}

export interface DropdownProps {
  options: OptionType[];
  value?: OptionType | null;
  onChange?: (selected: OptionType | null) => void;
  placeholder?: string;
  formatOptionLabel?: (option: OptionType, meta: any) => React.ReactNode;
  zIndex?: string;
}
