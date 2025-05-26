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
  isDisabled?: boolean;
}

export interface ChapterOption extends BaseOption {
  value: number;
  isDisabled?: boolean;
}

export interface VerseOption extends BaseOption {
  value: number;
}

export type OptionType = BookOption | ChapterOption | VerseOption;

export interface DropdownProps {
  options: OptionType[];
  value?: OptionType | null;
  onChange?: (selected: OptionType | null) => void;
  placeholder?: string;
  formatOptionLabel?: (
    option: OptionType,
    context: { context: string }
  ) => React.ReactNode;
  zIndex?: string;
}