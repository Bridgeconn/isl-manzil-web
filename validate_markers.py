import os
import re
import csv
import json
from pathlib import Path

# --- paths ---
VERSE_MARKERS_DIR = "src/assets/data/verse_markers"
VERSIFICATION_FILE = "src/assets/data/versification.json"

TIME_FORMAT_REGEX = re.compile(r"^\d{2}:\d{2}:\d{2}:\d{2}$")

BOOK_CODE_MAP = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
    "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
    "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
    "Ezra": "EZR", "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB", "Psalms": "PSA",
    "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Songs": "SNG", "Isaiah": "ISA",
    "Jeremiah": "JER", "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN",
    "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
    "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG",
    "Zechariah": "ZEC", "Malachi": "MAL",
    "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
    "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Galatians": "GAL",
    "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL", "1 Thessalonians": "1TH",
    "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI", "Titus": "TIT",
    "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS", "1 Peter": "1PE", "2 Peter": "2PE",
    "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV"
}


def parse_time_to_tuple(t):
    h, m, s, f = map(int, t.split(":"))
    return (h, m, s, f)

def expand_verse(verse_str):
    if "_" in verse_str:
        start, end = map(int, verse_str.split("_"))
        return list(range(start, end + 1))
    return [int(verse_str)]

def validate_csv_file(filepath, versification_data):
    filename = os.path.basename(filepath)
    errors = []

    # Allow spaces and numbers in book names like "1 Timothy_2.csv"
    match = re.match(r"^([\dA-Za-z\s]+)_(\d+)\.csv$", filename)
    if not match:
        errors.append(f"Invalid filename format. Should be Book_Chapter.csv")
        return False, errors

    book_raw, chapter = match.groups()
    book = book_raw.strip()
    chapter_num = int(chapter)

    book_code = BOOK_CODE_MAP.get(book)
    if not book_code:
        errors.append(f"No mapping found for book '{book}'")
        return False, errors


    book, chapter = match.groups()
    chapter_num = int(chapter)
    book_code = BOOK_CODE_MAP.get(book)

    if not book_code:
        errors.append(f"No mapping found for book '{book}'")
        return False, errors

    max_verses_list = versification_data.get("maxVerses", {}).get(book_code)
    if not max_verses_list:
        errors.append(f"Book code '{book_code}' not found in versification.json")
        return False, errors

    if chapter_num > len(max_verses_list):
        errors.append(f"Chapter {chapter_num} exceeds available chapters for {book}")
        return False, errors

    max_verse = int(max_verses_list[chapter_num - 1])

    try:
        with open(filepath, newline='', encoding="utf-8") as f:
            reader = list(csv.reader(f))
    except Exception as e:
        errors.append(f"Error reading CSV: {e}")
        return False, errors

    if not reader:
        errors.append("Empty file.")
        return False, errors

    header = [h.strip().lower() for h in reader[0]]
    if header != ["verse", "time"]:
        errors.append(f"Invalid header. Expected ['verse', 'time'], got {header}")
        return False, errors

    rows = reader[1:]
    all_verses = []
    group_times = []
    group_ranges = []

    for line_num, row in enumerate(rows, start=2):
        if len(row) != 2:
            errors.append(f"Line {line_num}: should have exactly 2 columns.")
            continue

        verse_str, time_str = row
        time_str = time_str.strip()

        try:
            verse_expanded = expand_verse(verse_str)
        except ValueError:
            errors.append(f"Line {line_num}: invalid verse number '{verse_str}'")
            continue

        if not TIME_FORMAT_REGEX.match(time_str):
            errors.append(f"Line {line_num}: invalid time format '{time_str}'")
            continue

        all_verses.extend(verse_expanded)
        group_times.append(parse_time_to_tuple(time_str))
        group_ranges.append((verse_expanded[0], verse_expanded[-1]))

    expected_verses = list(range(1, max_verse + 1))
    missing = set(expected_verses) - set(all_verses)
    extra = set(all_verses) - set(expected_verses)
    if missing or extra:
        msg = f"Verse sequence mismatch for {book} {chapter}."
        if missing:
            msg += f" Missing verses: {sorted(missing)}."
        if extra:
            msg += f" Unexpected verses: {sorted(extra)}."
        errors.append(msg)

    for i in range(1, len(group_times)):
        if group_times[i] <= group_times[i - 1]:
            prev_range = group_ranges[i - 1]
            curr_range = group_ranges[i]
            prev_label = f"{prev_range[0]}" if prev_range[0] == prev_range[1] else f"{prev_range[0]}_{prev_range[1]}"
            curr_label = f"{curr_range[0]}" if curr_range[0] == curr_range[1] else f"{curr_range[0]}_{curr_range[1]}"
            errors.append(
                f"Time not increasing between verse {prev_label} and {curr_label} ({group_times[i-1]} → {group_times[i]})"
            )

    return (len(errors) == 0), errors


def main():
    verse_dir = Path(VERSE_MARKERS_DIR)
    if not verse_dir.exists():
        print(f"Folder not found: {VERSE_MARKERS_DIR}")
        return

    with open(VERSIFICATION_FILE, "r", encoding="utf-8") as f:
        versification_data = json.load(f)

    csv_files = list(verse_dir.glob("*.csv"))
    if not csv_files:
        print("No CSV files found.")
        return

    passed_count = 0
    failed_count = 0
    failed_files = []  # collect for summary

    for file in csv_files:
        passed, errors = validate_csv_file(file, versification_data)
        if passed:
            passed_count += 1
        else:
            failed_count += 1
            failed_files.append({
                "file": file.name,
                "errors": errors
            })
            print(f"\n {file.name} FAILED ({len(errors)} errors)")
            for e in errors:
                print(f"   - {e}")

    print("\n=== SUMMARY ===")
    print(f"Total files checked : {len(csv_files)}")
    print(f" Passed             : {passed_count}")
    print(f" Failed             : {failed_count}")

if __name__ == "__main__":
    main()
